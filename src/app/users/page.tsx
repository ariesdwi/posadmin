"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Loader2, User, Shield, UserCog } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface UserData {
  id: number;
  email: string;
  name: string;
  role: "ADMIN" | "KASIR";
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  
  // Form States
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "KASIR" as "ADMIN" | "KASIR"
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      role: "KASIR"
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
        role: formData.role
      });
      setIsAddOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Failed to add user", error);
      alert("Failed to add user");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (user: UserData) => {
    setCurrentUser(user);
    setFormData({
      name: user.name || "",
      email: user.email,
      password: "", // Leave blank if not changing
      role: user.role
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormLoading(true);
    try {
      // API only allows updating name and isActive
      await api.patch(`/users/${currentUser.id}`, {
        name: formData.name
        // isActive: true // Can be added if needed
      });
      setIsEditOpen(false);
      fetchData();
    } catch (error) {
        console.error("Failed to update user", error);
        alert("Failed to update user");
    } finally {
        setFormLoading(false);
    }
  };

  const handleDeleteClick = (user: UserData) => {
    setCurrentUser(user);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!currentUser) return;
    setFormLoading(true);
    try {
      await api.delete(`/users/${currentUser.id}`);
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
        console.error("Failed to delete user", error);
        alert("Failed to delete user");
    } finally {
        setFormLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Header />
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent inline-block">
                User Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage admin and cashier accounts.
              </p>
            </div>
            <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Add User
            </Button>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none shadow-none focus-visible:ring-0 bg-transparent text-base"
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
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
                            No users found.
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <div className="font-medium">{user.name || "No Name"}</div>
                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
                                {user.role === 'ADMIN' ? 'Administrator' : 'Cashier'}
                            </span>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                {/* Prevent deleting own account or some logic if needed */}
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
        </main>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new account for an admin or cashier.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="role">Role</Label>
                    <select 
                        id="role" 
                        name="role" 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={formData.role} 
                        onChange={handleInputChange}
                        required
                    >
                        <option value="KASIR">Kasir</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
             </div>
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={formLoading}>
                    {formLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Save
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
             <DialogDescription>Update account details for {currentUser?.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} required />
             </div>
             <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
             </div>
             <div className="space-y-2">
                <Label htmlFor="edit-password">Password (Leave blank to keep current)</Label>
                <Input id="edit-password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
             </div>
             <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <select 
                    id="edit-role" 
                    name="role" 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.role} 
                    onChange={handleInputChange}
                    required
                >
                    <option value="KASIR">Cashier</option>
                    <option value="ADMIN">Administrator</option>
                </select>
             </div>
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={formLoading}>
                     {formLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Update User
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
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
    </div>
  );
}
