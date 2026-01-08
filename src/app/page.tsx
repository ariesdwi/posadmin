"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    LineChart,
    Line
} from "recharts";
import { 
    DollarSign, 
    CreditCard, 
    TrendingUp, 
    Users,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch daily, weekly, monthly stats
        // We can use the /reports endpoint. 
        // For dashboard, we usually show today's sales, this week's, and this month's.
        
        const today = new Date().toISOString().split('T')[0];
        const month = today.slice(0, 7);
        const startOfMonth = `${month}-01`;
        const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
        
        // Parallel requests
        const [dailyRes, monthlyRes, categoryRes] = await Promise.all([
             api.get(`/reports/daily?date=${today}`),
             api.get(`/reports/monthly?month=${month}`),
             api.get(`/reports/revenue-by-category?startDate=${startOfMonth}&endDate=${endOfMonth}`)
        ]);

        setStats({
            daily: dailyRes.data,
            monthly: monthlyRes.data,
            categoryRevenue: categoryRes.data || []
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
        // Don't show error immediately, just let it fail silently or show partial data if possible
        setError("Failed to load some dashboard data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
          <div>
             <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent inline-block">
                Dashboard
             </h1>
             <p className="text-muted-foreground mt-2">
                Overview of your store's performance.
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
                      title="Today's Revenue" 
                      value={formatCurrency(stats?.daily?.summary?.totalRevenue || 0)} 
                      icon={DollarSign}
                      description={`${stats?.daily?.summary?.totalTransactions || 0} transactions`}
                      trend="up"
                   />
                   <StatCard 
                      title="Monthly Revenue" 
                      value={formatCurrency(stats?.monthly?.summary?.totalRevenue || 0)} 
                      icon={TrendingUp}
                      description="This month so far"
                   />
                    <StatCard 
                      title="Total Products" 
                      value="--" 
                      icon={Package}
                      description="Active products"
                   />
                    <StatCard 
                      title="Active Cashiers" 
                      value="--" 
                      icon={Users}
                      description="Staff members"
                   />
               </div>

                {/* Charts Area */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="col-span-4 shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader>
                      <CardTitle>Revenue by Category</CardTitle>
                      <CardDescription>
                         Monthly breakdown by product category.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <div className="space-y-4">
                         {stats?.categoryRevenue && stats.categoryRevenue.length > 0 ? (
                           stats.categoryRevenue.map((cat: any, i: number) => {
                             const total = stats.categoryRevenue.reduce((sum: number, c: any) => sum + c.revenue, 0);
                             const percentage = ((cat.revenue / total) * 100).toFixed(1);
                             return (
                               <div key={i} className="space-y-2">
                                 <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                     <div className="font-medium">{cat.category}</div>
                                     <div className="text-xs text-muted-foreground">({cat.itemsSold} items)</div>
                                   </div>
                                   <div className="text-right">
                                     <div className="font-bold">{formatCurrency(cat.revenue)}</div>
                                     <div className="text-xs text-muted-foreground">{percentage}%</div>
                                   </div>
                                 </div>
                                 <div className="w-full bg-muted rounded-full h-2">
                                   <div 
                                     className="bg-primary h-2 rounded-full transition-all" 
                                     style={{ width: `${percentage}%` }}
                                   />
                                 </div>
                               </div>
                             );
                           })
                         ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground py-8">
                                No category data available
                            </div>
                         )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="col-span-3 shadow-sm border-slate-200 dark:border-slate-800">
                    <CardHeader>
                      <CardTitle>Best Sellers Today</CardTitle>
                      <CardDescription>
                        Top selling products
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-4">
                          {stats?.daily?.bestSellers && stats.daily.bestSellers.length > 0 ? (
                            stats.daily.bestSellers.slice(0, 5).map((item: any, i: number) => (
                              <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm">
                                    {i + 1}
                                  </div>
                                  <div>
                                    <div className="font-medium">{item.productName}</div>
                                    <div className="text-xs text-muted-foreground">{formatCurrency(item.revenue)}</div>
                                  </div>
                                </div>
                                <div className="text-sm font-medium">{item.quantitySold} sold</div>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground text-center py-8">
                              No sales data available yet.
                            </div>
                          )}
                       </div>
                    </CardContent>
                  </Card>
                </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, description, trend }: any) {
    return (
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 transition-all hover:shadow-md hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}
