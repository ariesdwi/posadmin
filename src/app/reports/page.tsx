"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/api";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { 
    Loader2, 
    TrendingUp, 
    Calendar, 
    DollarSign, 
    Download, 
    CreditCard, 
    ShoppingBag, 
    Users,
    FileText,
    Trash2,
    MoreVertical,
    Eye,
    Activity,
    TrendingDown
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ReportData {
    daily: any;
    weekly: any;
    monthly: any;
    custom: any;
    bestSellers: any[];
}

const COLORS = ['#7c7fff', '#0ea5e9', '#10B981', '#F59E0B', '#F43F5E'];

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ReportData>({
        daily: null,
        weekly: null,
        monthly: null,
        custom: null,
        bestSellers: []
    });
    const [customLoading, setCustomLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    // Details Modal State
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Initialize dates
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Calculate start of week (Monday)
                const d = new Date();
                const day = d.getDay();
                const diff = d.getDate() - day + (day == 0 ? -6 : 1);
                const monday = new Date(d.setDate(diff)).toISOString().split('T')[0];

                const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
                    api.get(`/reports/daily?date=${today}`).catch(e => ({ data: null })),
                    api.get(`/reports/weekly?startDate=${monday}`).catch(e => ({ data: null })),
                    api.get(`/reports/monthly?month=${currentMonth}`).catch(e => ({ data: null }))
                ]);

                setData({
                    daily: dailyRes.data,
                    weekly: weeklyRes.data,
                    monthly: monthlyRes.data,
                    custom: null,
                    bestSellers: dailyRes.data?.bestSellers || []
                });
            } catch (err) {
                console.error("Failed to fetch report data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const fetchCustomReport = async () => {
        if (!startDate || !endDate) {
            alert("Silakan pilih tanggal mulai dan tanggal akhir");
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            alert("Tanggal mulai harus sebelum tanggal akhir");
            return;
        }

        try {
            setCustomLoading(true);
            const response = await api.get(`/reports/custom?startDate=${startDate}&endDate=${endDate}`);
            setData(prev => ({
                ...prev,
                custom: response.data
            }));
        } catch (err) {
            console.error("Failed to fetch custom report", err);
            alert("Gagal mengambil laporan. Silakan coba lagi.");
        } finally {
            setCustomLoading(false);
        }
    };

    const downloadPDF = async (type: 'daily' | 'weekly' | 'monthly' | 'custom') => {
        try {
            setDownloadLoading(true);

            const params: any = { type };

            if (type === 'daily') {
                params.date = today;
            } else if (type === 'weekly') {
                const d = new Date();
                const day = d.getDay();
                const diff = d.getDate() - day + (day == 0 ? -6 : 1);
                params.startDate = new Date(d.setDate(diff)).toISOString().split('T')[0];
            } else if (type === 'monthly') {
                params.month = currentMonth;
            } else if (type === 'custom') {
                params.startDate = startDate;
                params.endDate = endDate;
            }

            const response = await api.get('/reports/export/pdf', {
                params,
                responseType: 'blob',
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `laporan-${type}-${today}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Failed to download PDF", err);
            alert("Gagal mengunduh PDF. Silakan coba lagi.");
        } finally {
            setDownloadLoading(false);
        }
    };

    const handleViewDetails = async (txn: any) => {
        try {
            setDetailsLoading(true);
            setSelectedTransaction(txn);
            setDetailsOpen(true);
            
            // Fetch fresh details with items
            const response = await api.get(`/transactions/${txn.id}`);
            setSelectedTransaction(response.data);
        } catch (err) {
            console.error("Failed to fetch transaction details", err);
            // We still show the partial data from the list
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleDeleteTransaction = async () => {
        if (!transactionToDelete) return;

        try {
            setDeleteLoading(true);
            await api.delete(`/transactions/${transactionToDelete.id}`);
            
            // Show success message
            alert(`Transaction ${transactionToDelete.transactionNumber} deleted successfully`);
            
            // Refresh the current report data
            const today = new Date().toISOString().split('T')[0];
            const month = today.slice(0, 7);
            const d = new Date();
            const day = d.getDay();
            const diff = d.getDate() - day + (day == 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff)).toISOString().split('T')[0];

            const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
                api.get(`/reports/daily?date=${today}`).catch(e => ({ data: null })),
                api.get(`/reports/weekly?startDate=${monday}`).catch(e => ({ data: null })),
                api.get(`/reports/monthly?month=${month}`).catch(e => ({ data: null }))
            ]);

            setData(prev => ({
                ...prev,
                daily: dailyRes.data,
                weekly: weeklyRes.data,
                monthly: monthlyRes.data,
            }));
        } catch (err: any) {
            console.error("Failed to delete transaction", err);
            alert(err.response?.data?.message || "Failed to delete transaction. Please try again.");
        } finally {
            setDeleteLoading(false);
            setDeleteDialogOpen(false);
            setTransactionToDelete(null);
        }
    };

    return (
        <div className="flex bg-background min-h-screen">
            <Sidebar />
            <div className="flex-1 md:ml-64 flex flex-col overflow-x-hidden min-w-0">
                <Header />
                <main className="flex-1 p-4 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto min-w-0">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                Dashboard Laporan
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Ringkasan eksekutif dan analisis performa bisnis Anda.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-[60vh] flex items-center justify-center">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Tabs defaultValue="executive" className="w-full">
                            <div className="overflow-x-auto pb-2 max-w-full">
                                <TabsList className="inline-flex md:grid md:grid-cols-6 mb-8 bg-muted/50 p-1">
                                    <TabsTrigger value="executive" className="flex-shrink-0 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">Ikhtisar Eksekutif</TabsTrigger>
                                    <TabsTrigger value="daily" className="flex-shrink-0 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">Harian</TabsTrigger>
                                    <TabsTrigger value="weekly" className="flex-shrink-0 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">Mingguan</TabsTrigger>
                                    <TabsTrigger value="monthly" className="flex-shrink-0 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">Bulanan</TabsTrigger>
                                    <TabsTrigger value="margin" className="flex-shrink-0 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">Profitabilitas</TabsTrigger>
                                    <TabsTrigger value="custom" className="flex-shrink-0 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap">Custom</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="executive" className="animate-fade-in space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="flex flex-col gap-2">
                                            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                                <Activity className="w-6 h-6 text-primary" />
                                                Performa Bisnis
                                            </h2>
                                            <p className="text-muted-foreground text-sm">Analisis pertumbuhan dan profitabilitas secara keseluruhan.</p>
                                        </div>

                                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                            <SummaryCard 
                                                title="Total Pendapatan" 
                                                value={formatCurrency(data.monthly?.summary?.totalRevenue || 0)} 
                                                icon={DollarSign} 
                                                growth={15.4}
                                                subtitle="Bulan ini vs Bulan lalu"
                                                variant="primary"
                                            />
                                            <SummaryCard 
                                                title="Total Laba Bersih" 
                                                value={formatCurrency(data.monthly?.summary?.totalProfit || 0)} 
                                                icon={TrendingUp} 
                                                growth={8.2}
                                                subtitle="Efisiensi operasional"
                                                variant="success"
                                            />
                                        </div>

                                        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                                            <CardHeader className="bg-slate-50/50 pb-8">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <CardTitle className="text-lg font-bold">Tren Pendapatan & Laba</CardTitle>
                                                        <CardDescription>Visualisasi pertumbuhan finansial per periode</CardDescription>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                            <div className="w-3 h-3 rounded-full bg-primary" /> Pendapatan
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                            <div className="w-3 h-3 rounded-full bg-emerald-500" /> Laba
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="h-[350px] pt-0">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={data.monthly?.dailyRevenue || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                                                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                                            </linearGradient>
                                                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis 
                                                            dataKey="date" 
                                                            axisLine={false} 
                                                            tickLine={false} 
                                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                            tickFormatter={(str) => {
                                                                const date = new Date(str);
                                                                return date.getDate().toString();
                                                            }}
                                                        />
                                                        <YAxis 
                                                            axisLine={false} 
                                                            tickLine={false} 
                                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                            tickFormatter={(val) => `Rp${val/1000}k`}
                                                        />
                                                        <Tooltip 
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                            formatter={(val: any) => formatCurrency(val)}
                                                        />
                                                        <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                                        <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-2">
                                            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                                <ShoppingBag className="w-6 h-6 text-amber-500" />
                                                Produk & Insight
                                            </h2>
                                            <p className="text-muted-foreground text-sm">Item paling berkontribusi pada laba.</p>
                                        </div>

                                        <Card className="border-none shadow-xl shadow-slate-200/50">
                                            <CardHeader>
                                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Top Kontributor Laba</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {data.monthly?.bestSellers?.slice(0, 5).map((item: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-4 relative">
                                                        <div className="relative">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black
                                                                ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}
                                                            `}>
                                                                {i + 1}
                                                            </div>
                                                            {i === 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <p className="text-sm font-bold text-slate-800 truncate">{item.productName}</p>
                                                                <span className="text-xs font-black text-emerald-600">{formatCurrency(item.profit)}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                                <span>{item.quantitySold} Terjual</span>
                                                                <span>Margin {Math.round((item.profit / (item.revenue || 1)) * 100)}%</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full ${i === 0 ? 'bg-amber-500' : 'bg-primary'}`}
                                                                    style={{ width: `${Math.min((item.profit / (data.monthly?.bestSellers[0]?.profit || 1)) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20 overflow-hidden relative">
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <TrendingUp className="w-24 h-24 rotate-12" />
                                            </div>
                                            <CardHeader>
                                                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Rasio Keuntungan</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="text-4xl font-black tracking-tighter">
                                                    {Math.round((data.monthly?.summary?.totalProfit / (data.monthly?.summary?.totalRevenue || 1)) * 100)}%
                                                </div>
                                                <p className="text-xs font-medium opacity-80 leading-relaxed">
                                                    Setiap <span className="underline decoration-2">Rp1.000</span> yang masuk, bisnis menghasilkan laba bersih sebesar <span className="font-bold whitespace-nowrap">Rp{Math.round((data.monthly?.summary?.totalProfit / (data.monthly?.summary?.totalRevenue || 1)) * 1000)}</span>.
                                                </p>
                                                <div className="pt-2">
                                                    <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold rounded-xl" onClick={() => downloadPDF('monthly')}>
                                                        Unduh Analisis .PDF
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="daily" className="animate-fade-in space-y-6">
                                <ReportHeader 
                                    title="Laporan Harian" 
                                    subtitle={`Ringkasan penjualan untuk ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                                    onDownload={() => downloadPDF('daily')}
                                    loading={downloadLoading}
                                    disabled={!data.daily}
                                />
                                <ReportContent 
                                    data={data.daily} 
                                    type="daily" 
                                    onDeleteTransaction={(txn: any) => {
                                        setTransactionToDelete(txn);
                                        setDeleteDialogOpen(true);
                                    }}
                                    onViewDetails={handleViewDetails}
                                />
                            </TabsContent>

                            <TabsContent value="weekly" className="animate-fade-in space-y-6">
                                <ReportHeader 
                                    title="Laporan Mingguan" 
                                    subtitle="Analisis performa minggu ini"
                                    onDownload={() => downloadPDF('weekly')}
                                    loading={downloadLoading}
                                    disabled={!data.weekly}
                                />
                                <ReportContent 
                                    data={data.weekly} 
                                    type="weekly" 
                                    onDeleteTransaction={(txn: any) => {
                                        setTransactionToDelete(txn);
                                        setDeleteDialogOpen(true);
                                    }}
                                    onViewDetails={handleViewDetails}
                                />
                            </TabsContent>

                            <TabsContent value="monthly" className="animate-fade-in space-y-6">
                                <ReportHeader 
                                    title="Laporan Bulanan" 
                                    subtitle={`Analisis performa bulan ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`}
                                    onDownload={() => downloadPDF('monthly')}
                                    loading={downloadLoading}
                                    disabled={!data.monthly}
                                />
                                <ReportContent 
                                    data={data.monthly} 
                                    type="monthly" 
                                    onDeleteTransaction={(txn: any) => {
                                        setTransactionToDelete(txn);
                                        setDeleteDialogOpen(true);
                                    }}
                                    onViewDetails={handleViewDetails}
                                />
                            </TabsContent>

                            <TabsContent value="margin" className="animate-fade-in space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Analisis Profitabilitas</CardTitle>
                                        <CardDescription>Lihat rincian margin dan keuntungan dalam rentang waktu tertentu</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-col md:flex-row gap-4 items-end">
                                            <div className="grid w-full items-center gap-1.5">
                                                <Label htmlFor="marginStartDate">Tanggal Mulai</Label>
                                                <Input
                                                    id="marginStartDate"
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                />
                                            </div>
                                            <div className="grid w-full items-center gap-1.5">
                                                <Label htmlFor="marginEndDate">Tanggal Akhir</Label>
                                                <Input
                                                    id="marginEndDate"
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                />
                                            </div>
                                            <Button 
                                                onClick={async () => {
                                                    if (!startDate || !endDate) {
                                                        alert("Silakan pilih tanggal mulai dan tanggal akhir");
                                                        return;
                                                    }
                                                    try {
                                                        setCustomLoading(true);
                                                        const res = await api.get(`/reports/margin?startDate=${startDate}&endDate=${endDate}`);
                                                        setData(prev => ({ ...prev, custom: res.data }));
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert("Gagal memuat data margin");
                                                    } finally {
                                                        setCustomLoading(false);
                                                    }
                                                }}
                                                disabled={customLoading}
                                                className="w-full md:w-auto min-w-[140px]"
                                            >
                                                {customLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                                                Lihat Margin
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {data.custom && (
                                    <ReportContent 
                                        data={data.custom} 
                                        type="margin" 
                                        onDeleteTransaction={(txn: any) => {
                                            setTransactionToDelete(txn);
                                            setDeleteDialogOpen(true);
                                        }}
                                        onViewDetails={handleViewDetails}
                                    />
                                )}
                            </TabsContent>

                            <TabsContent value="custom" className="animate-fade-in space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Pilih Periode Laporan</CardTitle>
                                        <CardDescription>Tentukan rentang tanggal untuk analisis spesifik</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-col md:flex-row gap-4 items-end">
                                            <div className="grid w-full items-center gap-1.5">
                                                <Label htmlFor="startDate">Tanggal Mulai</Label>
                                                <Input
                                                    id="startDate"
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                />
                                            </div>
                                            <div className="grid w-full items-center gap-1.5">
                                                <Label htmlFor="endDate">Tanggal Akhir</Label>
                                                <Input
                                                    id="endDate"
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                />
                                            </div>
                                            <Button 
                                                onClick={fetchCustomReport}
                                                disabled={customLoading}
                                                className="w-full md:w-auto min-w-[140px]"
                                            >
                                                {customLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                                                Generate
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {data.custom && (
                                    <>
                                        <div className="flex justify-between items-center py-4 border-b">
                                            <div>
                                                <h3 className="text-lg font-semibold">Hasil Laporan Custom</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Periode: {startDate} s/d {endDate}
                                                </p>
                                            </div>
                                            <Button 
                                                onClick={() => downloadPDF('custom')}
                                                disabled={downloadLoading}
                                                variant="outline"
                                            >
                                                {downloadLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                                Download PDF
                                            </Button>
                                        </div>
                                        <ReportContent 
                                            data={data.custom} 
                                            type="custom" 
                                            onDeleteTransaction={(txn: any) => {
                                                setTransactionToDelete(txn);
                                                setDeleteDialogOpen(true);
                                            }}
                                            onViewDetails={handleViewDetails}
                                        />
                                    </>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </main>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Transaction</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete transaction <strong>{transactionToDelete?.transactionNumber}</strong>?
                            <br />
                            <span className="text-foreground font-semibold mt-2 inline-block">
                                Amount: {transactionToDelete && formatCurrency(transactionToDelete.totalAmount)}
                            </span>
                            <p className="mt-3 font-semibold text-destructive">This action cannot be undone!</p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            type="button" 
                            variant="destructive" 
                            onClick={handleDeleteTransaction} 
                            disabled={deleteLoading}
                        >
                            {deleteLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transaction Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader className="space-y-2 pb-4">
                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg pr-8">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                            <span className="truncate">Detail Transaksi {selectedTransaction?.transactionNumber}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            Rincian item dan pembayaran untuk transaksi ini.
                        </DialogDescription>
                    </DialogHeader>

                    {detailsLoading && !selectedTransaction?.items ? (
                        <div className="py-12 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-4 sm:space-y-6">
                            {/* Transaction Info Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-[10px] sm:text-xs font-medium">Tanggal</p>
                                    <p className="font-medium text-xs sm:text-sm leading-tight">
                                        {selectedTransaction && new Date(selectedTransaction.createdAt).toLocaleDateString('id-ID', { 
                                            day: '2-digit', 
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                                        {selectedTransaction && new Date(selectedTransaction.createdAt).toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-[10px] sm:text-xs font-medium">Kasir</p>
                                    <p className="font-medium text-xs sm:text-sm truncate" title={selectedTransaction?.cashier || selectedTransaction?.user?.name}>
                                        {selectedTransaction?.cashier || selectedTransaction?.user?.name}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-[10px] sm:text-xs font-medium">Metode</p>
                                    <p className="font-medium text-xs sm:text-sm">{selectedTransaction?.paymentMethod}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-[10px] sm:text-xs font-medium">Status</p>
                                    <p className="font-medium text-emerald-600 text-xs sm:text-sm">{selectedTransaction?.status}</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <h3 className="text-sm font-semibold mb-2 px-1">Item Transaksi</h3>
                                <div className="overflow-x-auto -mx-4 sm:mx-0">
                                    <div className="inline-block min-w-full align-middle max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                        <Table className="min-w-full">
                                            <TableHeader className="sticky top-0 bg-white z-10">
                                                <TableRow>
                                                    <TableHead className="text-xs sm:text-sm px-2 sm:px-4">Produk</TableHead>
                                                    <TableHead className="text-center text-xs sm:text-sm px-2 sm:px-4 w-16 sm:w-20">Qty</TableHead>
                                                    <TableHead className="text-right text-xs sm:text-sm px-2 sm:px-4">Harga</TableHead>
                                                    <TableHead className="text-right text-xs sm:text-sm px-2 sm:px-4">Subtotal</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedTransaction?.items?.map((item: any) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium text-xs sm:text-sm px-2 sm:px-4 max-w-[120px] sm:max-w-none">
                                                            <span className="line-clamp-2 sm:line-clamp-1">{item.productName}</span>
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs sm:text-sm px-2 sm:px-4">{item.quantity}</TableCell>
                                                        <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4">
                                                            {formatCurrency(item.price)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4">
                                                            {formatCurrency(item.subtotal)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div className="flex flex-col items-end space-y-2 pt-4 border-t px-1 sm:px-0">
                                <div className="flex justify-between w-full sm:max-w-[240px] text-xs sm:text-sm text-muted-foreground">
                                    <span>Total:</span>
                                    <span className="font-medium">{selectedTransaction && formatCurrency(selectedTransaction.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between w-full sm:max-w-[240px] text-xs sm:text-sm">
                                    <span>Bayar:</span>
                                    <span className="font-medium">{selectedTransaction && formatCurrency(selectedTransaction.paymentAmount || selectedTransaction.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between w-full sm:max-w-[240px] font-bold text-sm sm:text-base border-t pt-2 mt-1">
                                    <span>Kembali:</span>
                                    <span className="text-emerald-600">{selectedTransaction && formatCurrency(selectedTransaction.changeAmount || 0)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="mt-6 sm:mt-4">
                        <Button type="button" variant="outline" onClick={() => setDetailsOpen(false)} className="w-full sm:w-auto">
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ReportHeader({ title, subtitle, onDownload, loading, disabled }: any) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                <p className="text-muted-foreground">{subtitle}</p>
            </div>
            <Button 
                onClick={onDownload}
                disabled={disabled || loading}
                variant="default"
                className="bg-primary hover:bg-primary/90 text-white shadow-sm w-full md:w-auto"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Download className="w-4 h-4 mr-2" />
                )}
                Download Report (PDF)
            </Button>
        </div>
    );
}

function ReportContent({ data, type, onDeleteTransaction, onViewDetails }: any) {
    if (!data) return <EmptyState />;

    const { summary } = data;

    // Transform payment method data for Pie Chart
    const paymentData = data.revenueByPaymentMethod 
        ? Object.entries(data.revenueByPaymentMethod).map(([name, value]) => ({ name, value }))
        : [];

    return (
        <div className="space-y-6">
            {/* Executive Summary Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <SummaryCard 
                    title="Total Pendapatan" 
                    value={formatCurrency(summary.totalRevenue || 0)} 
                    icon={DollarSign} 
                    subtitle="Gross Revenue"
                />
                <SummaryCard 
                    title="Total Modal" 
                    value={formatCurrency(summary.totalCost || 0)} 
                    icon={ShoppingBag} 
                    subtitle="Cost of Goods"
                />
                 <SummaryCard 
                    title="Total Profit" 
                    value={formatCurrency(summary.totalProfit || 0)} 
                    icon={TrendingUp} 
                    subtitle="Net Gain"
                />
                <SummaryCard 
                    title="Margin Rata-rata" 
                    value={`${Math.round(summary.averageMargin || 0)}%`} 
                    icon={TrendingUp} 
                    subtitle="Efficiency"
                />
                <SummaryCard 
                    title="Transaksi" 
                    value={summary.totalTransactions || 0} 
                    icon={Users} 
                    subtitle="Volume"
                />
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                {/* Main Charts Area */}
                <Card className="lg:col-span-4 shadow-sm border-border/50">
                    <CardHeader>
                        <CardTitle>Analisis Metode Pembayaran</CardTitle>
                        <CardDescription>Distribusi pendapatan berdasarkan metode pembayaran</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px] sm:h-[300px] flex items-center justify-center">
                        {paymentData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {paymentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value: any) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-muted-foreground text-sm">Belum ada data pembayaran</div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="lg:col-span-3 shadow-sm border-border/50">
                    <CardHeader>
                        <CardTitle>Produk Terlaris</CardTitle>
                        <CardDescription>Top 5 produk dengan performa terbaik</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.bestSellers?.slice(0, 5).map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                        ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-muted text-muted-foreground'}
                                    `}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 space-y-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm font-medium">
                                            <span className="truncate">{item.productName}</span>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-[10px] font-bold text-emerald-600">
                                                    {formatCurrency(item.profit || 0)} profit
                                                </span>
                                                <span className="text-muted-foreground">{item.quantitySold} sold</span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary rounded-full transition-all duration-500" 
                                                style={{ width: `${Math.min((item.quantitySold / (data.bestSellers[0].quantitySold || 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!data.bestSellers || data.bestSellers.length === 0) && (
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                    Tidak ada data penjualan item
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <Card className="shadow-sm border-border/50 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Riwayat Transaksi</CardTitle>
                        <CardDescription>Daftar transaksi rinci untuk periode ini</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    {data.transactions && data.transactions.length > 0 ? (
                        <div className="overflow-x-auto">
                        <Table className="min-w-[600px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Transaksi</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Kasir</TableHead>
                                    <TableHead>Metode</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.transactions.slice(0, 10).map((txn: any) => (
                                    <TableRow key={txn.id} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">{txn.transactionNumber}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span>{new Date(txn.createdAt).toLocaleDateString()}</span>
                                                <span className="text-xs text-muted-foreground">{new Date(txn.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{txn.cashier}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {txn.paymentMethod}
                                            </span>
                                        </TableCell>
                                        <TableCell>{txn.itemCount}</TableCell>
                                        <TableCell className="text-right font-bold text-foreground">
                                            {formatCurrency(txn.totalAmount)}
                                        </TableCell>
                                        <TableCell className="text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                                    onClick={() => onViewDetails(txn)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => onDeleteTransaction(txn)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                            <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                            <p>Belum ada transaksi pada periode ini.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function SummaryCard({ title, value, icon: Icon, growth, subtitle, variant = "default" }: any) {
    const isPositive = growth > 0;
    
    return (
        <Card className={`group relative shadow-sm border-none overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white`}>
            <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-300 group-hover:w-2
                ${variant === 'primary' ? 'bg-primary' : variant === 'success' ? 'bg-emerald-500' : 'bg-slate-200'}
            `} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-xl transition-colors
                    ${variant === 'primary' ? 'bg-indigo-50 text-primary' : variant === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}
                `}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors">{value}</div>
                <div className="flex flex-col mt-3 gap-1">
                    {growth !== undefined && (
                        <div className={`flex items-center gap-1.5 text-xs font-black
                            ${isPositive ? 'text-emerald-600' : 'text-rose-600'}
                        `}>
                            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            <span>{isPositive ? '+' : ''}{growth}%</span>
                            <span className="text-slate-300 font-medium">vs per. lalu</span>
                        </div>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium italic">
                        {subtitle}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-muted/50 p-4 rounded-full mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Tidak Ada Data</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
                Belum ada laporan yang tersedia untuk periode ini. Mulai transaksi untuk melihat data.
            </p>
        </div>
    );
}
