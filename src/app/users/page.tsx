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
      alert("Gagal menambah pengguna");
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
        alert("Gagal memperbarui pengguna");
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
        alert("Gagal menghapus pengguna");
    } finally {
        setFormLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Header />
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground inline-block">
                Manajemen Pengguna
              </h1>
              <p className="text-muted-foreground mt-2">
                Kelola akun admin dan kasir.
              </p>
            </div>
            <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Tambah Pengguna
            </Button>
          </div>

          <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Cari pengguna..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none shadow-none focus-visible:ring-0 bg-transparent text-base"
            />
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-background/50">
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
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
                            Pengguna tidak ditemukan.
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-slate-100">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <div className="font-medium">{user.name || "Tanpa Nama"}</div>
                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {user.role === 'ADMIN' ? 'Administrator' : 'Kasir'}
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
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>Buat akun baru untuk admin atau kasir.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="password">Kata Sandi</Label>
                    <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="role">Peran</Label>
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
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Batal</Button>
                <Button type="submit" disabled={formLoading}>
                    {formLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Simpan
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
             <DialogDescription>Perbarui rincian akun untuk {currentUser?.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="edit-name">Nama</Label>
                <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} required />
             </div>
             <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
             </div>
             <div className="space-y-2">
                <Label htmlFor="edit-password">Kata Sandi (Kosongkan jika tidak ingin diubah)</Label>
                <Input id="edit-password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
             </div>
             <div className="space-y-2">
                <Label htmlFor="edit-role">Peran</Label>
                <select 
                    id="edit-role" 
                    name="role" 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.role} 
                    onChange={handleInputChange}
                    required
                >
                    <option value="KASIR">Kasir</option>
                    <option value="ADMIN">Administrator</option>
                </select>
             </div>
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Batal</Button>
                <Button type="submit" disabled={formLoading}>
                     {formLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Perbarui Pengguna
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pengguna</DialogTitle>
            <DialogDescription>
                Apakah Anda yakin ingin menghapus <strong>{currentUser?.email}</strong>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
             <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
             <Button type="button" variant="destructive" onClick={handleDeleteSubmit} disabled={formLoading}>
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                 Hapus
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
