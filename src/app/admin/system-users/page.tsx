"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Trash2, Loader2, Shield } from "lucide-react";
import api from "@/lib/api";

interface SystemUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function SystemUsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  
  // Form States
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: ""
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Use the admin endpoint to get all ADMIN role users
      const res = await api.get("/users/admin/by-role?role=ADMIN");
      setUsers(res.data);
    } catch (error: any) {
      console.error("Failed to fetch system users", error);
      alert("Failed to load system users. Please try again.");
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
      email: "",
      password: "",
      name: ""
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post("/users", {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: "ADMIN"
      });
      
      setIsAddOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Failed to create system user", error);
      if (error.response?.data?.message) {
        alert(`Failed to create user: ${error.response.data.message}`);
      } else {
        alert("Failed to create system user");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = (user: SystemUser) => {
    setCurrentUser(user);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!currentUser) return;
    setFormLoading(true);
    try {
      // Use admin endpoint to delete user
      await api.delete(`/users/admin/${currentUser.id}`);
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to delete user", error);
      alert("Failed to delete system user");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-1 p-8 space-y-8 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            System Users
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage system administrators (ADMIN role only).
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Add Admin
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Search admins..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0 bg-transparent text-base"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No system users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-indigo-100">
                        <Shield className="w-4 h-4 text-indigo-700" />
                      </div>
                      <div>
                        <div className="font-medium">{user.name || "No Name"}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString('id-ID')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(user)}>
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

      {/* Add Admin Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add System Administrator</DialogTitle>
            <DialogDescription>Create a new ADMIN user with full system access.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Admin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete System User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{currentUser?.email}</strong>? This action cannot be undone.
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
