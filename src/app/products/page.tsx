"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Loader2, Package } from "lucide-react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { createProduct, updateProduct } from "../../services/productService";

console.log('ProductService imported:', { createProduct, updateProduct });

import { useAuth } from "@/context/AuthContext";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number | string;
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
  
  // Helper to ensure image URLs always point to the correct backend address
  const getValidImageUrl = (url: string | undefined) => {
    if (!url) return "";
    
    // If it's a data URL (base64) or external (https://i.imgur...), return as is
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.3:3000'; // Current IP
    
    // If it's a relative path, prepend the current backend URL
    if (url.startsWith('/')) {
        return `${API_BASE}${url}`;
    }

    // If it's an absolute URL from our own backend (potentially old IP), fix the host
    if (url.startsWith('http')) {
        try {
            const urlObj = new URL(url);
            // Check if it looks like our backend path (e.g. /uploads)
            if (urlObj.pathname.startsWith('/uploads')) {
                const baseObj = new URL(API_BASE);
                urlObj.protocol = baseObj.protocol;
                urlObj.hostname = baseObj.hostname;
                urlObj.port = baseObj.port;
                return urlObj.toString();
            }
        } catch (e) {
            // Invalid URL, ignore
        }
    }
    
    return url;
  };

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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await createProduct({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        categoryId: formData.categoryId,
        file: selectedFile || undefined,
        status: "AVAILABLE", // Default status
      });
      
      setIsAddOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Failed to add product", error);
      alert("Gagal menambah produk");
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
      await updateProduct(currentProduct.id, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        categoryId: formData.categoryId,
        file: selectedFile || undefined,
        imageUrl: formData.image, // Pass existing/manual URL if no file
      });

      setIsEditOpen(false);
      fetchData();
    } catch (error: any) {
        console.error("Failed to update product", error);
        if (error.response?.data) {
          console.error("Backend Error Details:", error.response.data);
          alert(`Gagal memperbarui produk: ${error.response.data.message || JSON.stringify(error.response.data)}`);
        } else {
          alert("Gagal memperbarui produk");
        }
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
        alert("Gagal menghapus produk");
    } finally {
        setFormLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Header />
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Katalog Produk
              </h1>
              <p className="text-muted-foreground mt-1">
                Kelola item menu dan inventaris toko Anda secara visual.
              </p>
            </div>
            <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="shadow-lg shadow-primary/25 h-11 px-6 font-semibold">
              <Plus className="w-5 h-5 mr-2" /> Tambah Produk Baru
            </Button>
          </div>

          <div className="flex items-center gap-4 bg-white p-2 pl-5 rounded-2xl border border-border shadow-sm max-w-2xl">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Cari berdasarkan nama atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none shadow-none focus-visible:ring-0 bg-transparent text-base h-10"
            />
          </div>
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-20 text-center shadow-sm">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Produk tidak ditemukan</h3>
              <p className="text-muted-foreground mt-1">Coba sesuaikan pencarian Anda atau tambah produk baru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group overflow-hidden border-border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="aspect-square relative overflow-hidden bg-slate-100">
                    {product.imageUrl ? (
                      <img 
                        src={getValidImageUrl(product.imageUrl)} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${product.imageUrl ? 'hidden' : ''}`}>
                      <Package className="w-12 h-12 text-muted-foreground/20" />
                    </div>
                    
                    {/* Corner Badge for Stock */}
                    {product.stock < 10 && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        Stok Menipis
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        {product.category?.name || "Tanpa Kategori"}
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground text-lg line-clamp-1 mb-2" title={product.name}>
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="text-lg font-black text-foreground">
                        {formatCurrency(Number(product.price))}
                      </div>
                      <div className={`text-xs font-medium px-2 py-1 rounded-full ${product.stock < 10 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-50 text-emerald-600'}`}>
                        Stok: {product.stock}
                      </div>
                    </div>
                  </CardContent>
                  
                  <div className="p-4 pt-0 flex gap-2 border-t border-border/50 mt-2 bg-slate-50/50">
                    <Button 
                      variant="ghost" 
                      className="flex-1 h-9 text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => handleEditClick(product)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="flex-1 h-9 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                      onClick={() => handleDeleteClick(product)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Hapus
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Produk Baru</DialogTitle>
            <DialogDescription>Buat item baru untuk menu Anda.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-6 py-4">
             {/* Basic Information */}
             <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Informasi Dasar</h3>
                <div className="space-y-3">
                   <div className="space-y-2">
                      <Label htmlFor="name">Nama Produk *</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="misal: Nasi Goreng Spesial" required />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="description">Deskripsi</Label>
                      <Input id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Deskripsi singkat" />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="categoryId">Kategori *</Label>
                      <select id="categoryId" name="categoryId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.categoryId} onChange={handleInputChange} required>
                          <option value="">Pilih kategori</option>
                          {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                      </select>
                   </div>
                </div>
             </div>
             {/* Pricing & Stock */}
             <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Harga & Inventaris</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label htmlFor="price">Harga (Rp) *</Label>
                      <Input id="price" name="price" type="number" min="0" value={formData.price} onChange={handleInputChange} placeholder="25000" required />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="stock">Stok *</Label>
                      <Input id="stock" name="stock" type="number" min="0" value={formData.stock} onChange={handleInputChange} placeholder="50" required />
                   </div>
                </div>
             </div>
             {/* Image */}
             <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Gambar Produk</h3>
                <div className="space-y-3">
                   <Input id="imageFile" name="imageFile" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                   <p className="text-xs text-muted-foreground">JPG, PNG, atau WebP (maks 5MB)</p>
                   {imagePreview && (<div className="flex gap-3 p-3 bg-muted rounded-lg"><img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-md" /><span className="text-sm text-muted-foreground">Siap diunggah</span></div>)}
                </div>
             </div>
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Batal</Button>
                <Button type="submit" disabled={formLoading}>{formLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{formLoading ? "Membuat..." : "Buat Produk"}</Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
             <DialogDescription>Perbarui rincian untuk {currentProduct?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6 py-4">
             {/* Basic Information */}
             <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Informasi Dasar</h3>
                <div className="space-y-3">
                   <div className="space-y-2">
                      <Label htmlFor="edit-name">Nama Produk *</Label>
                      <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} required />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="edit-description">Deskripsi</Label>
                      <Input id="edit-description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Deskripsi singkat" />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="edit-categoryId">Kategori *</Label>
                      <select id="edit-categoryId" name="categoryId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.categoryId} onChange={handleInputChange} required>
                          <option value="">Pilih kategori</option>
                          {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                      </select>
                   </div>
                </div>
             </div>
             {/* Pricing & Stock */}
             <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Harga & Inventaris</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label htmlFor="edit-price">Harga (Rp) *</Label>
                      <Input id="edit-price" name="price" type="number" min="0" value={formData.price} onChange={handleInputChange} required />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="edit-stock">Stok *</Label>
                      <Input id="edit-stock" name="stock" type="number" min="0" value={formData.stock} onChange={handleInputChange} required />
                   </div>
                </div>
             </div>
             {/* Image */}
             <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Gambar Produk</h3>
                <div className="space-y-3">
                   <Input id="edit-imageFile" name="imageFile" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                   <p className="text-xs text-muted-foreground">Unggah gambar baru (JPG, PNG, atau WebP)</p>
                   {(imagePreview || formData.image) && (<div className="flex gap-3 p-3 bg-muted rounded-lg"><img src={imagePreview || getValidImageUrl(formData.image)} alt="Preview" className="w-20 h-20 object-cover rounded-md" /><span className="text-sm text-muted-foreground">{imagePreview ? "Gambar baru dipilih" : "Gambar saat ini"}</span></div>)}
                </div>
             </div>
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Batal</Button>
                <Button type="submit" disabled={formLoading}>{formLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{formLoading ? "Memperbarui..." : "Perbarui Produk"}</Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Produk</DialogTitle>
            <DialogDescription>
                Apakah Anda yakin ingin menghapus <strong>{currentProduct?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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
