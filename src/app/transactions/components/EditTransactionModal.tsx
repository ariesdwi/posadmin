"use client";

import { useState, useEffect } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Plus, 
    Trash2, 
    Loader2, 
    AlertCircle,
    Package,
    Minus,
    Calendar,
    Receipt,
    Table as TableIcon,
    Wallet,
    Info
} from "lucide-react";
import { updateTransaction } from "@/services/transactionService";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface Product {
    id: string;
    name: string;
    price: number;
    costPrice?: number;
}

interface TransactionItem {
    id?: string;
    productId: string | null;
    productName: string;
    price: number;
    quantity: number;
    subtotal: number;
    costPrice?: number;
}

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
    onSuccess: () => void;
}

export default function EditTransactionModal({ isOpen, onClose, transaction, onSuccess }: EditTransactionModalProps) {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        transactionNumber: "",
        createdAt: "",
        status: "",
        paymentMethod: "",
        paymentAmount: 0,
        tableNumber: "",
        notes: "",
        subtotal: 0,
        tax: 0,
        total: 0,
        items: [] as TransactionItem[]
    });

    useEffect(() => {
        if (isOpen && transaction) {
            setFormData({
                transactionNumber: transaction.transactionNumber || "",
                createdAt: transaction.createdAt ? new Date(transaction.createdAt).toISOString().slice(0, 16) : "",
                status: transaction.status || "PENDING",
                paymentMethod: transaction.paymentMethod || "CASH",
                paymentAmount: Number(transaction.paymentAmount) || 0,
                tableNumber: transaction.tableNumber || "",
                notes: transaction.notes || "",
                subtotal: Number(transaction.totalAmount) || 0, // Fallback subtotal
                tax: Number(transaction.taxAmount) || 0,
                total: Number(transaction.totalAmount) || 0,
                items: transaction.items?.map((item: any) => ({
                    id: item.id,
                    productId: item.productId,
                    productName: item.productName,
                    price: Number(item.price),
                    quantity: Number(item.quantity),
                    subtotal: Number(item.subtotal),
                    costPrice: Number(item.costPrice || 0)
                })) || []
            });
            fetchProducts();
        }
    }, [isOpen, transaction]);

    const fetchProducts = async () => {
        try {
            setProductsLoading(true);
            const res = await api.get("/menu");
            setProducts(res.data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setProductsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "paymentAmount" || name === "tax" ? Number(value) : value
        }));
    };

    const calculateTotals = (items: TransactionItem[], tax: number) => {
        const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
        const total = subtotal + tax;
        setFormData(prev => ({ ...prev, items, subtotal, total }));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        const item = { ...newItems[index], [field]: value };
        
        if (field === "productId") {
            const product = products.find(p => p.id === value);
            if (product) {
                item.productName = product.name;
                item.price = product.price;
                item.costPrice = product.costPrice;
            }
        }
        
        if (field === "price" || field === "quantity" || field === "productId") {
            item.subtotal = item.price * item.quantity;
        }
        
        newItems[index] = item;
        calculateTotals(newItems, formData.tax);
    };

    const addItem = () => {
        const newItems = [
            ...formData.items, 
            { productId: null, productName: "", price: 0, quantity: 1, subtotal: 0 }
        ];
        calculateTotals(newItems, formData.tax);
    };

    const removeItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        calculateTotals(newItems, formData.tax);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                createdAt: new Date(formData.createdAt).toISOString()
            };
            await updateTransaction(transaction.id, payload);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to update transaction", error);
            alert("Gagal memperbarui transaksi. Periksa kembali data Anda.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-none shadow-2xl">
                <DialogHeader className="p-6 bg-primary text-primary-foreground sticky top-0 z-10">
                    <div className="flex justify-between items-center">
                        <div>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Edit Transaksi</DialogTitle>
                            <DialogDescription className="text-primary-foreground/80 font-mono text-xs mt-1">
                                #{transaction?.transactionNumber}
                            </DialogDescription>
                        </div>
                        <Receipt className="w-8 h-8 opacity-50" />
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-8 bg-white">
                    {/* Basic Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <Receipt className="w-3 h-3" /> Nomor Transaksi
                            </Label>
                            <Input 
                                name="transactionNumber"
                                value={formData.transactionNumber}
                                onChange={handleInputChange}
                                className="font-mono font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Tanggal & Waktu
                            </Label>
                            <Input 
                                type="datetime-local"
                                name="createdAt"
                                value={formData.createdAt}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <TableIcon className="w-3 h-3" /> Nomor Meja
                            </Label>
                            <Input 
                                name="tableNumber"
                                value={formData.tableNumber}
                                onChange={handleInputChange}
                                placeholder="Meja 01"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <Info className="w-3 h-3" /> Status
                            </Label>
                            <select 
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="PENDING">PENDING</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="CANCELLED">CANCELLED</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <Wallet className="w-3 h-3" /> Metode Pembayaran
                            </Label>
                            <select 
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleInputChange}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="CASH">CASH</option>
                                <option value="CARD">CARD</option>
                                <option value="QRIS">QRIS</option>
                                <option value="TRANSFER">TRANSFER</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <Receipt className="w-3 h-3" /> Nominal Bayar
                            </Label>
                            <Input 
                                type="number"
                                name="paymentAmount"
                                value={formData.paymentAmount}
                                onChange={handleInputChange}
                                className="font-bold text-primary"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Catatan</Label>
                        <textarea 
                            name="notes"
                            value={formData.notes}
                            onChange={(e: any) => handleInputChange(e)}
                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Catatan pesanan khusus..."
                        />
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-sm font-black uppercase tracking-tighter text-slate-800">Daftar Pesanan</h3>
                            <Button type="button" size="sm" onClick={addItem} className="h-8 gap-2 rounded-full">
                                <Plus className="w-4 h-4" /> Tambah Item
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {formData.items.map((item, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 relative group">
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase">Produk</Label>
                                        <select 
                                            value={item.productId || ""}
                                            onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            <option value="">Custom Item / Pilih Produk</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}</option>
                                            ))}
                                        </select>
                                        {!item.productId && (
                                            <Input 
                                                placeholder="Nama Produk Custom"
                                                value={item.productName}
                                                onChange={(e) => handleItemChange(index, "productName", e.target.value)}
                                                className="h-8 text-xs mt-2"
                                            />
                                        )}
                                    </div>
                                    <div className="w-full md:w-32 space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase">Harga</Label>
                                        <Input 
                                            type="number"
                                            value={item.price}
                                            onChange={(e) => handleItemChange(index, "price", Number(e.target.value))}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="w-full md:w-24 space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase">Qty</Label>
                                        <div className="flex items-center gap-1">
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-9 w-9 p-0 rounded-lg"
                                                onClick={() => handleItemChange(index, "quantity", Math.max(1, item.quantity - 1))}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </Button>
                                            <Input 
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                                                className="h-9 text-center p-1"
                                            />
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-9 w-9 p-0 rounded-lg"
                                                onClick={() => handleItemChange(index, "quantity", item.quantity + 1)}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-32 space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase">Subtotal</Label>
                                        <div className="h-9 flex items-center font-bold text-slate-900">
                                            {formatCurrency(item.subtotal)}
                                        </div>
                                    </div>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => removeItem(index)}
                                        className="absolute -top-2 -right-2 md:relative md:top-0 md:right-0 h-9 w-9 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {formData.items.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50 text-slate-400">
                                <Package className="w-10 h-10 mb-2 opacity-20" />
                                <p className="text-sm font-medium">Belum ada item dalam transaksi.</p>
                                <Button type="button" variant="link" onClick={addItem} className="mt-2 text-primary font-bold">
                                    Tambah item pertama
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Summary Section */}
                    <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 shadow-xl">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-400 uppercase tracking-widest">Subtotal</span>
                            <span className="text-xl font-medium">{formatCurrency(formData.subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-t border-slate-800 pt-4">
                            <span className="font-bold text-slate-400 uppercase tracking-widest">Pajak (Tax)</span>
                            <div className="flex items-center gap-3">
                                <Input 
                                    type="number"
                                    name="tax"
                                    value={formData.tax}
                                    onChange={handleInputChange}
                                    className="w-24 h-8 bg-slate-800 border-slate-700 text-right font-bold text-white"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                            <div>
                                <span className="font-black text-xs uppercase tracking-[0.2em] text-primary">Total Akhir</span>
                                <p className="text-[10px] text-slate-500 font-bold mt-1">Kembalian: {formatCurrency(Math.max(0, formData.paymentAmount - formData.total))}</p>
                            </div>
                            <span className="text-4xl font-black tracking-tighter text-primary">
                                {formatCurrency(formData.total)}
                            </span>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={onClose} 
                            disabled={loading}
                            className="flex-1 h-12 rounded-xl font-bold"
                        >
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 h-12 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                "Simpan Perubahan"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
