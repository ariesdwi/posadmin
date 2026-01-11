"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { 
  Building2, 
  Users, 
  DollarSign,
  TrendingUp,
  Loader2
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch all businesses
        const businessesRes = await api.get("/businesses");
        const businesses = businessesRes.data;
        
        // Fetch stats for each business
        const statsPromises = businesses.map((b: any) =>
          api.get(`/businesses/${b.id}/stats`).catch(() => ({
            data: { stats: { totalRevenue: 0, transactions: 0 } }
          }))
        );
        const statsResults = await Promise.all(statsPromises);
        
        // Aggregate platform-wide statistics
        const totalUsers = businesses.reduce((sum: number, b: any) => sum + (b._count?.users || 0), 0);
        const totalProducts = businesses.reduce((sum: number, b: any) => sum + (b._count?.products || 0), 0);
        const totalTransactions = businesses.reduce((sum: number, b: any) => sum + (b._count?.transactions || 0), 0);
        const totalRevenue = statsResults.reduce((sum: number, r: any) => sum + (r.data?.stats?.totalRevenue || 0), 0);
        
        // Sort businesses by creation date (newest first) and take top 5
        const recentBusinesses = [...businesses]
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        
        setStats({
          totalBusinesses: businesses.length,
          totalRevenue,
          activeUsers: totalUsers,
          totalProducts,
          totalTransactions,
          recentBusinesses
        });
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          System Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage all businesses and view system-wide statistics.
        </p>
      </div>
      
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Quick Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Total Businesses" 
              value={stats?.totalBusinesses || 0} 
              icon={Building2}
              description="Registered businesses"
            />
            <StatCard 
              title="Total Revenue" 
              value={`Rp ${(stats?.totalRevenue || 0).toLocaleString('id-ID')}`} 
              icon={DollarSign}
              description="All businesses combined"
            />
            <StatCard 
              title="Active Users" 
              value={stats?.activeUsers || 0} 
              icon={Users}
              description="Business owners + employees"
            />
            <StatCard 
              title="Growth" 
              value="+0%" 
              icon={TrendingUp}
              description="This month"
            />
          </div>

          {/* Recent Businesses */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Business Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentBusinesses && stats.recentBusinesses.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentBusinesses.map((business: any) => (
                    <div key={business.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{business.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {business._count?.users || 0} users · {business._count?.products || 0} products
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(business.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No recent registrations. Go to Businesses page to create a new business.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}

function StatCard({ title, value, icon: Icon, description }: any) {
  return (
    <Card className="shadow-sm border-border bg-card transition-all hover:shadow-md hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 font-medium">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
