"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Building2, Users, Package, ShoppingCart, DollarSign, Loader2, Shield, User, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import api from "@/lib/api";

interface BusinessDetails {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  }>;
  _count: {
    products: number;
    categories: number;
    transactions: number;
  };
}

interface BusinessStats {
  users: number;
  products: number;
  categories: number;
  transactions: number;
  totalRevenue: number;
}

export default function BusinessDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;

  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchBusinessData();
  }, [businessId]);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      
      const [businessRes, statsRes] = await Promise.all([
        api.get(`/businesses/${businessId}`),
        api.get(`/businesses/${businessId}/stats`).catch(() => ({
          data: { stats: { users: 0, products: 0, categories: 0, transactions: 0, totalRevenue: 0 } }
        }))
      ]);

      setBusiness(businessRes.data);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error("Failed to fetch business data", error);
      alert("Failed to load business details");
      router.push("/admin/businesses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!business) return;
    
    setDeleteLoading(true);
    try {
      await api.delete(`/businesses/${businessId}`);
      alert("Business deleted successfully!");
      router.push("/admin/businesses");
    } catch (error) {
      console.error("Failed to delete business", error);
      alert("Failed to delete business");
    } finally {
      setDeleteLoading(false);
      setIsDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!business) {
    return (
      <main className="flex-1 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Business not found</h2>
          <Button onClick={() => router.push("/admin/businesses")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Businesses
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/businesses")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{business.name}</h1>
            <p className="text-muted-foreground mt-1">
              Business ID: {business.id}
            </p>
          </div>
        </div>
        <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Business
        </Button>
      </div>

      {/* Business Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{business.phone || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{business.address || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{new Date(business.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">{new Date(business.updatedAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Users" value={stats?.users || 0} icon={Users} />
        <StatCard title="Products" value={stats?.products || 0} icon={Package} />
        <StatCard title="Categories" value={stats?.categories || 0} icon={Building2} />
        <StatCard title="Transactions" value={stats?.transactions || 0} icon={ShoppingCart} />
        <StatCard 
          title="Total Revenue" 
          value={`Rp ${(stats?.totalRevenue || 0).toLocaleString('id-ID')}`} 
          icon={DollarSign}
          highlight
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({business.users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-background/50">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {business.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      No users found for this business.
                    </TableCell>
                  </TableRow>
                ) : (
                  business.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${user.role === 'BUSINESS_OWNER' ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
                            {user.role === 'BUSINESS_OWNER' ? (
                              <Shield className="w-4 h-4 text-indigo-700" />
                            ) : (
                              <User className="w-4 h-4 text-emerald-700" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{user.name || "No Name"}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          user.role === 'BUSINESS_OWNER' 
                            ? 'bg-indigo-100 text-indigo-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {user.role === 'BUSINESS_OWNER' ? 'Business Owner' : 'Kasir'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Business</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{business.name}</strong>? This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{business.users.length} users</li>
                <li>{stats?.products || 0} products</li>
                <li>{stats?.categories || 0} categories</li>
                <li>{stats?.transactions || 0} transactions</li>
              </ul>
              <p className="mt-3 font-semibold text-destructive">This action cannot be undone!</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function StatCard({ title, value, icon: Icon, highlight = false }: any) {
  return (
    <Card className={`shadow-sm border-border transition-all hover:shadow-md hover:-translate-y-1 ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={`p-2.5 rounded-xl ${highlight ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
