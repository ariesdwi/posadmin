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
    FileText
} from "lucide-react";

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

    return (
        <div className="flex bg-background min-h-screen">
            <Sidebar />
            <div className="flex-1 md:ml-64 flex flex-col">
                <Header />
                <main className="flex-1 p-8 space-y-8 overflow-y-auto">
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
                        <Tabs defaultValue="monthly" className="w-full">
                            <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                                <TabsList className="flex w-full md:grid md:grid-cols-4 max-w-xl mb-8 bg-muted/50 p-1 min-w-[320px]">
                                    <TabsTrigger value="daily" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">Harian</TabsTrigger>
                                    <TabsTrigger value="weekly" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">Mingguan</TabsTrigger>
                                    <TabsTrigger value="monthly" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">Bulanan</TabsTrigger>
                                    <TabsTrigger value="custom" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">Custom</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="daily" className="animate-fade-in space-y-6">
                                <ReportHeader 
                                    title="Laporan Harian" 
                                    subtitle={`Ringkasan penjualan untuk ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                                    onDownload={() => downloadPDF('daily')}
                                    loading={downloadLoading}
                                    disabled={!data.daily}
                                />
                                <ReportContent data={data.daily} type="daily" />
                            </TabsContent>

                            <TabsContent value="weekly" className="animate-fade-in space-y-6">
                                <ReportHeader 
                                    title="Laporan Mingguan" 
                                    subtitle="Analisis performa minggu ini"
                                    onDownload={() => downloadPDF('weekly')}
                                    loading={downloadLoading}
                                    disabled={!data.weekly}
                                />
                                <ReportContent data={data.weekly} type="weekly" />
                            </TabsContent>

                            <TabsContent value="monthly" className="animate-fade-in space-y-6">
                                <ReportHeader 
                                    title="Laporan Bulanan" 
                                    subtitle={`Analisis performa bulan ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`}
                                    onDownload={() => downloadPDF('monthly')}
                                    loading={downloadLoading}
                                    disabled={!data.monthly}
                                />
                                <ReportContent data={data.monthly} type="monthly" />
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
                                        <ReportContent data={data.custom} type="custom" />
                                    </>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </main>
            </div>
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

function ReportContent({ data, type }: any) {
    if (!data) return <EmptyState />;

    const { summary } = data;

    // Transform payment method data for Pie Chart
    const paymentData = data.revenueByPaymentMethod 
        ? Object.entries(data.revenueByPaymentMethod).map(([name, value]) => ({ name, value }))
        : [];

    return (
        <div className="space-y-6">
            {/* Executive Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard 
                    title="Total Pendapatan" 
                    value={formatCurrency(summary.totalRevenue || 0)} 
                    icon={DollarSign} 
                    trend="up" // Mocked trend
                    subtitle="Gross Revenue"
                />
                <SummaryCard 
                    title="Total Transaksi" 
                    value={summary.totalTransactions || 0} 
                    icon={ShoppingBag} 
                    trend="neutral"
                    subtitle="Volume Penjualan"
                />
                <SummaryCard 
                    title="Nilai Rata-rata" 
                    value={formatCurrency(summary.averageTransactionValue || 0)} 
                    icon={CreditCard} 
                    trend="up"
                    subtitle="Per Customer"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Main Charts Area */}
                <Card className="md:col-span-4 shadow-sm border-border/50">
                    <CardHeader>
                        <CardTitle>Analisis Metode Pembayaran</CardTitle>
                        <CardDescription>Distribusi pendapatan berdasarkan metode pembayaran</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
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
                <Card className="md:col-span-3 shadow-sm border-border/50">
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
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>{item.productName}</span>
                                            <span className="text-muted-foreground">{item.quantitySold} sold</span>
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
                <CardContent className="p-0 sm:p-6 overflow-x-auto">
                    {data.transactions && data.transactions.length > 0 ? (
                        <Table className="min-w-[600px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Transaksi</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Kasir</TableHead>
                                    <TableHead>Metode</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.transactions.slice(0, 10).map((txn: any) => (
                                    <TableRow key={txn.id} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">{txn.transactionNumber}</TableCell>
                                        <TableCell>
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
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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

function SummaryCard({ title, value, icon: Icon, trend, subtitle }: any) {
    return (
        <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {subtitle}
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
