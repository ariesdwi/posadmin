"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Loader2, Layers } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Category {
  id: number;
  name: string;
  description?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  
  // Form States
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post("/categories", { name, description });
      setIsAddOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Failed to add category", error);
      alert("Failed to add category");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (category: Category) => {
    setCurrentCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory) return;
    setFormLoading(true);
    try {
      await api.patch(`/categories/${currentCategory.id}`, { name, description });
      setIsEditOpen(false);
      fetchData();
    } catch (error) {
        console.error("Failed to update category", error);
        alert("Failed to update category");
    } finally {
        setFormLoading(false);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCurrentCategory(category);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!currentCategory) return;
    setFormLoading(true);
    try {
      await api.delete(`/categories/${currentCategory.id}`);
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
        console.error("Failed to delete category", error);
        alert("Failed to delete category (Ensure it has no products)");
    } finally {
        setFormLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
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
                Categories
              </h1>
              <p className="text-muted-foreground mt-2">
                Organize your menu items.
              </p>
            </div>
            <Button onClick={() => { setName(""); setIsAddOpen(true); }} className="shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Add Category
            </Button>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search categories..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none shadow-none focus-visible:ring-0 bg-transparent text-base"
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900">
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                        </TableCell>
                    </TableRow>
                ) : filteredCategories.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                            No categories found.
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                                    <Layers className="w-4 h-4" />
                                </div>
                                {category.name}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(category)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(category)}>
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

      {/* Add Category Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
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
      
      {/* Edit Category Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="edit-name">Category Name</Label>
                <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
             </div>
             <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
             </div>
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={formLoading}>
                     {formLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Update
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
                Are you sure you want to delete <strong>{currentCategory?.name}</strong>?
                <br /><span className="text-red-500 text-xs">Note: Categories with products cannot be deleted.</span>
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
