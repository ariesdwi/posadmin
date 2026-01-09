"use client";

import { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    LineChart,
    Line,
    Legend
} from "recharts";
import { Loader2, TrendingUp, Calendar, DollarSign, Download } from "lucide-react";

interface ReportData {
    daily: any;
    weekly: any;
    monthly: any;
    custom: any;
    bestSellers: any[];
}

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
  const [pdfGenerating, setPdfGenerating] = useState(false);
  
  // Refs for PDF generation
  const dailyReportRef = useRef<HTMLDivElement>(null);
  const weeklyReportRef = useRef<HTMLDivElement>(null);
  const monthlyReportRef = useRef<HTMLDivElement>(null);
  const customReportRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const month = today.slice(0, 7);
        // Calculate start of week (Monday)
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day == 0 ? -6 : 1); 
        const monday = new Date(d.setDate(diff)).toISOString().split('T')[0];

        const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
             api.get(`/reports/daily?date=${today}`).catch(e => ({ data: null })),
             api.get(`/reports/weekly?startDate=${monday}`).catch(e => ({ data: null })),
             api.get(`/reports/monthly?month=${month}`).catch(e => ({ data: null }))
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

  const generatePDF = async (reportType: 'daily' | 'weekly' | 'monthly' | 'custom') => {
    try {
      setPdfGenerating(true);
      
      // Select the appropriate ref based on report type
      let reportRef: React.RefObject<HTMLDivElement | null>;
      let reportTitle = '';
      let filename = '';
      
      switch (reportType) {
        case 'daily':
          reportRef = dailyReportRef;
          reportTitle = 'Laporan Harian';
          filename = `laporan-harian-${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        case 'weekly':
          reportRef = weeklyReportRef;
          reportTitle = 'Laporan Mingguan';
          filename = `laporan-mingguan-${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        case 'monthly':
          reportRef = monthlyReportRef;
          reportTitle = 'Laporan Bulanan';
          filename = `laporan-bulanan-${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        case 'custom':
          reportRef = customReportRef;
          reportTitle = `Laporan Custom (${startDate} - ${endDate})`;
          filename = `laporan-custom-${startDate}-${endDate}.pdf`;
          break;
      }
      
      if (!reportRef.current) {
        alert('Konten laporan tidak ditemukan');
        return;
      }
      
      // Capture the report content as canvas
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions (A4 landscape)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions to fit the page
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // Top margin
      
      // Add the image to PDF, handling multiple pages if needed
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }
      
      // Save the PDF
      pdf.save(filename);
      
    } catch (error) {
      console.error('Failed to generate PDF', error);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Header />
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          <div>
             <h1 className="text-3xl font-bold tracking-tight text-foreground inline-block">
                Laporan Keuangan
              </h1>
              <p className="text-muted-foreground mt-2">
                Analisis performa penjualan Anda dalam berbagai periode waktu.
              </p>
          </div>

          {loading ? (
             <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
          ) : (
             <Tabs defaultValue="monthly" className="w-full">
                <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-8">
                    <TabsTrigger value="daily">Harian</TabsTrigger>
                    <TabsTrigger value="weekly">Mingguan</TabsTrigger>
                    <TabsTrigger value="monthly">Bulanan</TabsTrigger>
                    <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
                
                <TabsContent value="daily" className="space-y-4 animate-fade-in">
                    <div className="flex justify-end mb-4">
                        <Button 
                            onClick={() => generatePDF('daily')}
                            disabled={pdfGenerating || !data.daily}
                            variant="outline"
                        >
                            {pdfGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                </>
                            )}
                        </Button>
                    </div>
                    <div ref={dailyReportRef}>
                        <ReportSummary data={data.daily} title="Performa Hari Ini" icon={Calendar} />
                        {/* Daily might not have a graph unless we break down by hour, assuming backend provides hourly but if not, just summary */}
                         <Card>
                            <CardHeader>
                                <CardTitle>Transaksi Harian</CardTitle>
                                 <CardDescription>Rincian transaksi penjualan hari ini</CardDescription>
                            </CardHeader>
                            <CardContent>
                                 {/* If we had hourly data we'd graph it. For now, maybe just list transactions if available in daily report */}
                                 <div className="text-center py-10 text-muted-foreground">
                                    {data.daily?.transactions ? (
                                        <div className="space-y-2">
                                            <p>{data.daily.transactions.length} transaksi tercatat hari ini.</p>
                                        </div>
                                    ) : (
                                        "Tidak ada timeline transaksi rinci yang tersedia."
                                    )}
                                 </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="weekly" className="space-y-4 animate-fade-in">
                    <div className="flex justify-end mb-4">
                        <Button 
                            onClick={() => generatePDF('weekly')}
                            disabled={pdfGenerating || !data.weekly}
                            variant="outline"
                        >
                            {pdfGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                </>
                            )}
                        </Button>
                    </div>
                    <div ref={weeklyReportRef}>
                        <ReportSummary data={data.weekly} title="Performa Mingguan" icon={Calendar} />
                        <Card>
                            <CardHeader>
                                <CardTitle>Transaksi Mingguan</CardTitle>
                                <CardDescription>Semua transaksi dari minggu ini</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {data.weekly?.transactions && data.weekly.transactions.length > 0 ? (
                                    <div className="space-y-3">
                                        {data.weekly.transactions.map((txn: any) => (
                                            <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                                <div>
                                                    <div className="font-medium">{txn.transactionNumber}</div>
                                                     <div className="text-sm text-muted-foreground">
                                                         {txn.cashier} • {txn.itemCount} item • {new Date(txn.createdAt).toLocaleDateString('id-ID')}
                                                     </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">{formatCurrency(txn.totalAmount)}</div>
                                                    <div className="text-xs text-muted-foreground">{txn.paymentMethod}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex h-32 items-center justify-center text-muted-foreground">Tidak ada transaksi minggu ini</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="monthly" className="space-y-4 animate-fade-in">
                    <div className="flex justify-end mb-4">
                        <Button 
                            onClick={() => generatePDF('monthly')}
                            disabled={pdfGenerating || !data.monthly}
                            variant="outline"
                        >
                            {pdfGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                </>
                            )}
                        </Button>
                    </div>
                    <div ref={monthlyReportRef}>
                        <ReportSummary data={data.monthly} title="Performa Bulanan" icon={Calendar} />
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Best Sellers */}
                        <Card>
                             <CardHeader>
                                <CardTitle>Produk Terlaris</CardTitle>
                                <CardDescription>Produk teratas bulan ini</CardDescription>
                             </CardHeader>
                             <CardContent>
                                <div className="space-y-4">
                                    {data.monthly?.bestSellers?.slice(0, 5).map((item: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm">
                                                    {i + 1}
                                                </div>
                                                 <div>
                                                     <div className="font-medium">{item.productName}</div>
                                                     <div className="text-xs text-muted-foreground">{formatCurrency(item.revenue)} pendapatan</div>
                                                 </div>
                                             </div>
                                             <div className="text-sm font-medium">{item.quantitySold || 0} terjual</div>
                                        </div>
                                    ))}
                                     {(!data.monthly?.bestSellers || data.monthly.bestSellers.length === 0) && (
                                         <div className="text-center text-muted-foreground py-4">Data tidak tersedia</div>
                                     )}
                                </div>
                             </CardContent>
                        </Card>

                        {/* Payment Methods */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Pendapatan berdasarkan Metode Pembayaran</CardTitle>
                                <CardDescription>Rincian berdasarkan tipe pembayaran</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.monthly?.revenueByPaymentMethod && Object.entries(data.monthly.revenueByPaymentMethod).map(([method, amount]: [string, any]) => (
                                        <div key={method} className="flex items-center justify-between">
                                            <div className="font-medium">{method}</div>
                                            <div className="text-sm font-bold">{formatCurrency(amount)}</div>
                                        </div>
                                    ))}
                                     {(!data.monthly?.revenueByPaymentMethod || Object.keys(data.monthly.revenueByPaymentMethod).length === 0) && (
                                         <div className="text-center text-muted-foreground py-4">Data tidak tersedia</div>
                                     )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Transactions */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Transaksi Terakhir</CardTitle>
                                <CardDescription>Transaksi terbaru bulan ini</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {data.monthly?.transactions && data.monthly.transactions.length > 0 ? (
                                    <div className="space-y-3">
                                        {data.monthly.transactions.slice(0, 10).map((txn: any) => (
                                            <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                                <div>
                                                 <div className="font-medium">{txn.transactionNumber}</div>
                                                     <div className="text-sm text-muted-foreground">
                                                         {txn.cashier} • {txn.itemCount} item • {new Date(txn.createdAt).toLocaleDateString('id-ID')}
                                                     </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">{formatCurrency(txn.totalAmount)}</div>
                                                    <div className="text-xs text-muted-foreground">{txn.paymentMethod}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex h-32 items-center justify-center text-muted-foreground">Tidak ada transaksi bulan ini</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    </div>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4 animate-fade-in">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pilih Rentang Tanggal</CardTitle>
                            <CardDescription>Pilih tanggal mulai dan tanggal akhir untuk melihat laporan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Tanggal Mulai</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
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
                                    className="w-full md:w-auto"
                                >
                                    {customLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Memuat...
                                        </>
                                    ) : (
                                        "Generate Laporan"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {data.custom && (
                        <>
                            <div className="flex justify-end mb-4">
                                <Button 
                                    onClick={() => generatePDF('custom')}
                                    disabled={pdfGenerating}
                                    variant="outline"
                                >
                                    {pdfGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Generating PDF...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </>
                                    )}
                                </Button>
                            </div>
                            <div ref={customReportRef}>
                            <ReportSummary data={data.custom} title="Performa Custom" icon={Calendar} />
                            
                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Payment Methods */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Pendapatan berdasarkan Metode Pembayaran</CardTitle>
                                        <CardDescription>Rincian berdasarkan tipe pembayaran</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {data.custom?.revenueByPaymentMethod && Object.entries(data.custom.revenueByPaymentMethod).map(([method, amount]: [string, any]) => (
                                                <div key={method} className="flex items-center justify-between">
                                                    <div className="font-medium">{method}</div>
                                                    <div className="text-sm font-bold">{formatCurrency(amount)}</div>
                                                </div>
                                            ))}
                                            {(!data.custom?.revenueByPaymentMethod || Object.keys(data.custom.revenueByPaymentMethod).length === 0) && (
                                                <div className="text-center text-muted-foreground py-4">Data tidak tersedia</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Revenue by Cashier */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Pendapatan berdasarkan Kasir</CardTitle>
                                        <CardDescription>Rincian berdasarkan kasir</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {data.custom?.revenueByCashier && Object.entries(data.custom.revenueByCashier).map(([cashier, amount]: [string, any]) => (
                                                <div key={cashier} className="flex items-center justify-between">
                                                    <div className="font-medium">{cashier}</div>
                                                    <div className="text-sm font-bold">{formatCurrency(amount)}</div>
                                                </div>
                                            ))}
                                            {(!data.custom?.revenueByCashier || Object.keys(data.custom.revenueByCashier).length === 0) && (
                                                <div className="text-center text-muted-foreground py-4">Data tidak tersedia</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Best Sellers */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Produk Terlaris</CardTitle>
                                        <CardDescription>Produk teratas dalam periode ini</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {data.custom?.bestSellers?.slice(0, 5).map((item: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm">
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{item.productName}</div>
                                                            <div className="text-xs text-muted-foreground">{formatCurrency(item.revenue)} pendapatan</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-medium">{item.quantitySold || 0} terjual</div>
                                                </div>
                                            ))}
                                            {(!data.custom?.bestSellers || data.custom.bestSellers.length === 0) && (
                                                <div className="text-center text-muted-foreground py-4">Data tidak tersedia</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Recent Transactions */}
                                <Card className="md:col-span-2">
                                    <CardHeader>
                                        <CardTitle>Semua Transaksi</CardTitle>
                                        <CardDescription>Transaksi dalam periode yang dipilih</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {data.custom?.transactions && data.custom.transactions.length > 0 ? (
                                            <div className="space-y-3">
                                                {data.custom.transactions.map((txn: any) => (
                                                    <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                                        <div>
                                                            <div className="font-medium">{txn.transactionNumber}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {txn.cashier} • {txn.itemCount} item • {new Date(txn.createdAt).toLocaleDateString('id-ID')}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold">{formatCurrency(txn.totalAmount)}</div>
                                                            <div className="text-xs text-muted-foreground">{txn.paymentMethod}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex h-32 items-center justify-center text-muted-foreground">Tidak ada transaksi dalam periode ini</div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                            </div>
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

function ReportSummary({ data, title, icon: Icon }: any) {
    if (!data || !data.summary) return null;
    const { summary } = data;
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue || 0)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transaksi</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.totalTransactions || 0}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Nilai Rata-rata</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatCurrency(summary.averageTransactionValue || 0)}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
