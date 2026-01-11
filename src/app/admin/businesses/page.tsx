"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Loader2, Building2, Eye } from "lucide-react";
import api from "@/lib/api";

interface Business {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  createdAt: string;
  _count?: {
    users: number;
    products: number;
  };
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  
  // Form States
  const [formData, setFormData] = useState({
    businessName: "",
    ownerEmail: "",
    ownerPassword: "",
    ownerName: "",
    address: "",
    phone: ""
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/businesses");
      setBusinesses(res.data);
    } catch (error) {
      console.error("Failed to fetch businesses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      businessName: "",
      ownerEmail: "",
      ownerPassword: "",
      ownerName: "",
      address: "",
      phone: ""
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      // Use /auth/register to create new business + owner
      await api.post("/auth/register", {
        email: formData.ownerEmail,
        password: formData.ownerPassword,
        name: formData.ownerName,
        businessName: formData.businessName,
        role: "BUSINESS_OWNER"
      });

      
      setIsAddOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Failed to create business", error);
      if (error.response?.data?.message) {
        alert(`Gagal membuat bisnis: ${error.response.data.message}`);
      } else {
        alert("Gagal membuat bisnis");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = (business: Business) => {
    setCurrentBusiness(business);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!currentBusiness) return;
    setFormLoading(true);
    try {
      await api.delete(`/businesses/${currentBusiness.id}`);
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to delete business", error);
      alert("Gagal menghapus bisnis");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(b => 
    b.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-1 p-8 space-y-8 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Business Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all registered businesses and their owners.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="shadow-lg shadow-primary/20 w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Create Business
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Search businesses..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0 bg-transparent text-base"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow>
              <TableHead>Business Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredBusinesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No businesses found.
                </TableCell>
              </TableRow>
            ) : (
              filteredBusinesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{business.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {business._count?.users || 0} users · {business._count?.products || 0} products
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {business.phone && <div>{business.phone}</div>}
                      {business.address && <div className="text-xs text-muted-foreground">{business.address}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(business.createdAt).toLocaleDateString('id-ID')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/businesses/${business.id}`}>
                        <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(business)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Business Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-lg md:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create New Business</DialogTitle>
            <DialogDescription>Register a new business and create the owner account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input id="businessName" name="businessName" value={formData.businessName} onChange={handleInputChange} placeholder="Coffee Shop" required />
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Owner Details</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <Input id="ownerName" name="ownerName" value={formData.ownerName} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerEmail">Owner Email *</Label>
                  <Input id="ownerEmail" name="ownerEmail" type="email" value={formData.ownerEmail} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerPassword">Owner Password *</Label>
                  <Input id="ownerPassword" name="ownerPassword" type="password" value={formData.ownerPassword} onChange={handleInputChange} required />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Business
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Business</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{currentBusiness?.name}</strong>? This will also delete all associated users, products, and transactions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDeleteSubmit} disabled={formLoading}>
              {formLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
