"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Loader2, Package } from "lucide-react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: number;
  imageUrl?: string;
  category?: {
    id: number;
    name: string;
  };
}

interface Category {
  id: number;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  
  // Form States
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    image: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formLoading, setFormLoading] = useState(false);

  const { user } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        api.get("/menu"),
        api.get("/categories")
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
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
      name: "",
      description: "",
      price: "",
      stock: "",
      categoryId: "",
      image: ""
    });
    setSelectedFile(null);
    setImagePreview("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Backend returns { data: { imageUrl: "/uploads/..." } }
      // But our axios interceptor unwraps it, so we get { imageUrl: "/uploads/..." }
      const imageUrl = response.data.imageUrl;
      // Prepend base URL to make it a full URL
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://10.168.81.25:3000';
      return `${baseURL}${imageUrl}`;
    } catch (error) {
      console.error('Failed to upload image', error);
      throw error;
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      let imageUrl = formData.image;
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock),
        categoryId: formData.categoryId,
        imageUrl: imageUrl || "",
      };
      await api.post("/menu", payload);
      setIsAddOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Failed to add product", error);
      alert("Failed to add product");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      stock: String(product.stock),
      categoryId: String(product.categoryId),
      image: product.imageUrl || ""
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;
    setFormLoading(true);
    try {
      let imageUrl = formData.image;
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock),
        categoryId: formData.categoryId,
        imageUrl: imageUrl || "",
      };
      await api.patch(`/menu/${currentProduct.id}`, payload);
      setIsEditOpen(false);
      fetchData();
    } catch (error) {
        console.error("Failed to update product", error);
        alert("Failed to update product");
    } finally {
        setFormLoading(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setCurrentProduct(product);
    setIsDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!currentProduct) return;
    setFormLoading(true);
    try {
      await api.delete(`/menu/${currentProduct.id}`);
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
        console.error("Failed to delete product", error);
        alert("Failed to delete product");
    } finally {
        setFormLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category?.name.toLowerCase().includes(search.toLowerCase())
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
                Products
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your menu items and inventory.
              </p>
            </div>
            <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none shadow-none focus-visible:ring-0 bg-transparent text-base"
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                        </TableCell>
                    </TableRow>
                ) : filteredProducts.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            No products found.
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                                {product.imageUrl ? (
                                    <img 
                                        src={product.imageUrl} 
                                        alt={product.name}
                                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${product.imageUrl ? 'hidden' : ''}`}>
                                    <Package className="w-4 h-4 text-muted-foreground" />
                                </div>
                                {product.name}
                            </div>
                        </TableCell>
                        <TableCell>
                            <span className="px-2 py-1 rounded-md bg-secondary/10 text-secondary text-xs font-medium">
                                {product.category?.name || "Uncategorized"}
                            </span>
                        </TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell>
                            <span className={product.stock < 10 ? "text-destructive font-medium" : "text-emerald-600"}>
                                {product.stock}
                            </span>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(product)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(product)}>
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

      {/* Add Product Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Create a new item for your menu.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-6 py-4">
             {/* Basic Information */}
             <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Basic Information</h3>
                <div className="space-y-3">
                   <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Nasi Goreng Spesial" required />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description" />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="categoryId">Category *</Label>
                      <select id="categoryId" name="categoryId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.categoryId} onChange={handleInputChange} required>
                          <option value="">Select category</option>
                          {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                      </select>
                   </div>
                </div>
             </div>
             {/* Pricing & Stock */}
             <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Pricing & Inventory</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label htmlFor="price">Price (Rp) *</Label>
                      <Input id="price" name="price" type="number" min="0" value={formData.price} onChange={handleInputChange} placeholder="25000" required />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="stock">Stock *</Label>
                      <Input id="stock" name="stock" type="number" min="0" value={formData.stock} onChange={handleInputChange} placeholder="50" required />
                   </div>
                </div>
             </div>
             {/* Image */}
             <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Product Image</h3>
                <div className="space-y-3">
                   <Input id="imageFile" name="imageFile" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                   <p className="text-xs text-muted-foreground">JPG, PNG, or WebP (max 5MB)</p>
                   {imagePreview && (<div className="flex gap-3 p-3 bg-muted rounded-lg"><img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-md" /><span className="text-sm text-muted-foreground">Ready to upload</span></div>)}
                   <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">OR</span></div></div>
                   <div className="space-y-2"><Label htmlFor="image">Image URL</Label><Input id="image" name="image" type="url" value={formData.image} onChange={handleInputChange} placeholder="https://example.com/image.jpg" /><p className="text-xs text-muted-foreground">Paste direct link to image</p></div>
                </div>
             </div>
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={formLoading}>{formLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{formLoading ? "Creating..." : "Create Product"}</Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
             <DialogDescription>Update details for {currentProduct?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6 py-4">
             {/* Basic Information */}
             <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Basic Information</h3>
                <div className="space-y-3">
                   <div className="space-y-2">
                      <Label htmlFor="edit-name">Product Name *</Label>
                      <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} required />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Input id="edit-description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description" />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="edit-categoryId">Category *</Label>
                      <select id="edit-categoryId" name="categoryId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.categoryId} onChange={handleInputChange} required>
                          <option value="">Select category</option>
                          {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                      </select>
                   </div>
                </div>
             </div>
             {/* Pricing & Stock */}
             <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Pricing & Inventory</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label htmlFor="edit-price">Price (Rp) *</Label>
                      <Input id="edit-price" name="price" type="number" min="0" value={formData.price} onChange={handleInputChange} required />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="edit-stock">Stock *</Label>
                      <Input id="edit-stock" name="stock" type="number" min="0" value={formData.stock} onChange={handleInputChange} required />
                   </div>
                </div>
             </div>
             {/* Image */}
             <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Product Image</h3>
                <div className="space-y-3">
                   <Input id="edit-imageFile" name="imageFile" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                   <p className="text-xs text-muted-foreground">Upload new image (JPG, PNG, or WebP)</p>
                   {(imagePreview || formData.image) && (<div className="flex gap-3 p-3 bg-muted rounded-lg"><img src={imagePreview || formData.image} alt="Preview" className="w-20 h-20 object-cover rounded-md" /><span className="text-sm text-muted-foreground">{imagePreview ? "New image selected" : "Current image"}</span></div>)}
                   <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">OR</span></div></div>
                   <div className="space-y-2"><Label htmlFor="edit-image">Image URL</Label><Input id="edit-image" name="image" type="url" value={formData.image} onChange={handleInputChange} placeholder="https://example.com/image.jpg" /></div>
                </div>
             </div>
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={formLoading}>{formLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{formLoading ? "Updating..." : "Update Product"}</Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
                Are you sure you want to delete <strong>{currentProduct?.name}</strong>? This action cannot be undone.
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
