"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { 
    Calendar, 
    Search, 
    Filter, 
    Eye, 
    Download,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    Receipt,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Activity,
    Trash2,
    AlertTriangle,
    Printer
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getTransactions, deleteTransaction } from "@/services/transactionService";

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<{
        startDate: string;
        endDate: string;
        status: "PENDING" | "COMPLETED" | "CANCELLED" | "";
    }>({
        startDate: "",
        endDate: "",
        status: ""
    });
    
    // Details Modal
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Delete Modal
    const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await getTransactions(filters);
            setTransactions(res.data || []);
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Summaries
    const summaries = transactions.reduce((acc, trx) => {
        if (trx.status === "COMPLETED") {
            const amount = Number(trx.totalAmount) || 0;
            acc.revenue += amount;
            
            // Calculate profit if items have costPrice
            trx.items?.forEach((item: any) => {
                const price = Number(item.price) || 0;
                const cost = Number(item.product?.costPrice || item.costPrice || 0);
                const quantity = Number(item.quantity) || 0;
                if (cost > 0) {
                    acc.profit += (price - cost) * quantity;
                }
            });
            
            acc.completedCount += 1;
        }
        return acc;
    }, { revenue: 0, profit: 0, completedCount: 0 });

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTransactions();
    };

    const resetFilters = () => {
        setFilters({
            startDate: "",
            endDate: "",
            status: ""
        });
        // We need to fetch again with empty filters
        setTimeout(() => fetchTransactions(), 0);
    };

    const handleDelete = async () => {
        if (!transactionToDelete) return;
        
        try {
            setDeleting(true);
            await deleteTransaction(transactionToDelete.id);
            setIsDeleteOpen(false);
            setTransactionToDelete(null);
            fetchTransactions(); // Refresh list
        } catch (error) {
            console.error("Failed to delete transaction", error);
            alert("Gagal menghapus transaksi. Silakan coba lagi.");
        } finally {
            setDeleting(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case "COMPLETED":
                return (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        SELESAI
                    </div>
                );
            case "PENDING":
                return (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold w-fit">
                        <Clock className="w-3 h-3" />
                        PENDING
                    </div>
                );
            case "CANCELLED":
                return (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold w-fit">
                        <XCircle className="w-3 h-3" />
                        BATAL
                    </div>
                );
            default:
                return (
                    <div className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold w-fit">
                        {status}
                    </div>
                );
        }
    };

    return (
        <div className="flex bg-background min-h-screen">
            <Sidebar />
            <div className="flex-1 md:ml-64 flex flex-col">
                <Header />
                <main className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                Riwayat Transaksi
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Lihat dan kelola semua data penjualan.
                            </p>
                        </div>
                        <Button variant="outline" className="flex items-center gap-2">
                            <Download className="w-4 h-4" /> Ekspor CSV
                        </Button>
                    </div>

                    {/* Filters */}
                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <Filter className="w-4 h-4 text-primary" />
                                <span>Filter Pencarian</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal Mulai</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            type="date" 
                                            name="startDate"
                                            value={filters.startDate}
                                            onChange={handleFilterChange}
                                            className="pl-9" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal Akhir</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            type="date"
                                            name="endDate"
                                            value={filters.endDate}
                                            onChange={handleFilterChange}
                                            className="pl-9" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                                    <select 
                                        name="status"
                                        value={filters.status}
                                        onChange={handleFilterChange}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        <option value="">Semua Status</option>
                                        <option value="COMPLETED">Selesai</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="CANCELLED">Batal</option>
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" className="flex-1">Terapkan</Button>
                                    <Button type="button" variant="ghost" onClick={resetFilters}>Reset</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-border shadow-sm bg-gradient-to-br from-white to-slate-50">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Pendapatan</CardTitle>
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-foreground">
                                    {formatCurrency(summaries.revenue)}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                    <Activity className="w-3 h-3" /> Dari {summaries.completedCount} transaksi sukses
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-border shadow-sm bg-gradient-to-br from-white to-slate-50">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Estimasi Laba</CardTitle>
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-foreground">
                                    {formatCurrency(summaries.profit)}
                                </div>
                                {summaries.revenue > 0 && (
                                    <p className="text-[10px] text-blue-600 mt-1 font-bold">
                                        Margin: {Math.round((summaries.profit / summaries.revenue) * 100)}%
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-border shadow-sm bg-gradient-to-br from-white to-slate-50">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaksi Sukses</CardTitle>
                                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                    <Receipt className="w-4 h-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-foreground">
                                    {summaries.completedCount}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Tingkat keberhasilan: {transactions.length > 0 ? Math.round((summaries.completedCount / transactions.length) * 100) : 0}%
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Transactions Table */}
                    <Card className="border-border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead className="font-bold">No. Transaksi</TableHead>
                                        <TableHead className="font-bold">Tanggal</TableHead>
                                        <TableHead className="font-bold">Meja</TableHead>
                                        <TableHead className="font-bold">Total</TableHead>
                                        <TableHead className="font-bold">Status</TableHead>
                                        <TableHead className="font-bold text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-40 text-center">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                                <p className="text-sm text-muted-foreground mt-2">Memuat data...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                                Tidak ada transaksi ditemukan.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((trx) => (
                                            <TableRow key={trx.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="font-mono text-xs font-semibold">{trx.transactionNumber}</TableCell>
                                                <TableCell className="text-sm">{formatDate(trx.createdAt)}</TableCell>
                                                <TableCell className="text-sm font-medium">{trx.tableNumber || "-"}</TableCell>
                                                <TableCell className="font-bold">{formatCurrency(Number(trx.totalAmount))}</TableCell>
                                                <TableCell><StatusBadge status={trx.status} /></TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => {
                                                                setSelectedTransaction(trx);
                                                                setIsDetailsOpen(true);
                                                            }}
                                                            className="hover:text-primary h-8 w-8 p-0"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => {
                                                                setTransactionToDelete(trx);
                                                                setIsDeleteOpen(true);
                                                            }}
                                                            className="hover:text-destructive h-8 w-8 p-0"
                                                        >
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
                    </Card>
                </main>
            </div>

            {/* Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <div className="bg-primary p-6 text-primary-foreground">
                        <DialogHeader className="space-y-1">
                            <div className="flex justify-between items-start">
                                <DialogTitle className="text-xl font-black uppercase tracking-tight">Kwitansi POS</DialogTitle>
                                <Receipt className="w-6 h-6 opacity-50" />
                            </div>
                            <DialogDescription className="text-primary-foreground/80 text-xs font-mono">
                                {selectedTransaction?.transactionNumber}
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    
                    {selectedTransaction && (
                        <div className="p-6 space-y-6 bg-white">
                            <div className="flex flex-col gap-1 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                <div className="flex justify-between border-b border-dashed pb-2">
                                    <span>Waktu</span>
                                    <span className="text-foreground">{formatDate(selectedTransaction.createdAt)}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed py-2">
                                    <span>Kasir</span>
                                    <span className="text-foreground">{selectedTransaction.user?.name || "Sistem"}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed py-2">
                                    <span>Meja</span>
                                    <span className="text-foreground font-black">{selectedTransaction.tableNumber || "-"}</span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span>Status</span>
                                    <StatusBadge status={selectedTransaction.status} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Pesanan</span>
                                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                                </div>
                                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedTransaction.items?.map((item: any) => (
                                        <div key={item.id} className="flex flex-col gap-0.5">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-bold text-slate-800">{item.productName}</span>
                                                <span className="text-sm font-black">{formatCurrency(Number(item.subtotal))}</span>
                                            </div>
                                            <div className="flex text-[11px] text-muted-foreground font-medium italic">
                                                <span>{item.quantity} x {formatCurrency(Number(item.price))}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-2xl space-y-3 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-transparent to-primary/20"></div>
                                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                                    <span>Metode</span>
                                    <span className="text-foreground decoration-primary underline decoration-2 underline-offset-4">{selectedTransaction.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                                    <span className="text-sm font-black uppercase text-slate-500">Total</span>
                                    <span className="text-2xl font-black text-primary tracking-tighter">{formatCurrency(Number(selectedTransaction.totalAmount))}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Terima Kasih</p>
                                <div className="flex gap-2 w-full">
                                    <Button variant="outline" size="sm" className="flex-1 rounded-xl font-bold h-10 border-2" onClick={() => window.print()}>
                                        <Printer className="w-4 h-4 mr-2" /> Cetak
                                    </Button>
                                    <Button variant="default" size="sm" className="flex-1 rounded-xl font-bold h-10 shadow-lg shadow-primary/20" onClick={() => setIsDetailsOpen(false)}>
                                        Tutup
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="max-w-sm p-6 rounded-2xl border-none shadow-2xl">
                    <DialogHeader className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Hapus Transaksi?</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">
                                Tindakan ini tidak dapat dibatalkan. Data transaksi <span className="font-bold text-slate-900">#{transactionToDelete?.transactionNumber}</span> akan dihapus selamanya.
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                        <Button 
                            variant="ghost" 
                            className="flex-1 font-bold rounded-xl" 
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={deleting}
                        >
                            Batal
                        </Button>
                        <Button 
                            variant="destructive" 
                            className="flex-1 font-bold rounded-xl shadow-lg shadow-rose-200" 
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                "Ya, Hapus"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
