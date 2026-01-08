"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Loader2, TrendingUp, Calendar, DollarSign } from "lucide-react";

interface ReportData {
    daily: any;
    weekly: any;
    monthly: any;
    bestSellers: any[];
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData>({
      daily: null,
      weekly: null,
      monthly: null,
      bestSellers: []
  });

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

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Header />
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          <div>
             <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent inline-block">
                Financial Reports
             </h1>
             <p className="text-muted-foreground mt-2">
                Analyze your sales performance across different time periods.
             </p>
          </div>

          {loading ? (
             <div className="h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
          ) : (
             <Tabs defaultValue="monthly" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
                
                <TabsContent value="daily" className="space-y-4 animate-fade-in">
                    <ReportSummary data={data.daily} title="Today's Performance" icon={Calendar} />
                    {/* Daily might not have a graph unless we break down by hour, assuming backend provides hourly but if not, just summary */}
                     <Card>
                        <CardHeader>
                            <CardTitle>Daily Transactions</CardTitle>
                             <CardDescription>Breakdown of today's sales transactions</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {/* If we had hourly data we'd graph it. For now, maybe just list transactions if available in daily report */}
                             <div className="text-center py-10 text-muted-foreground">
                                {data.daily?.transactions ? (
                                    <div className="space-y-2">
                                        <p>{data.daily.transactions.length} transactions recorded today.</p>
                                    </div>
                                ) : (
                                    "No detailed transaction timeline available."
                                )}
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="weekly" className="space-y-4 animate-fade-in">
                    <ReportSummary data={data.weekly} title="Weekly Performance" icon={Calendar} />
                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly Transactions</CardTitle>
                            <CardDescription>All transactions from this week</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data.weekly?.transactions && data.weekly.transactions.length > 0 ? (
                                <div className="space-y-3">
                                    {data.weekly.transactions.map((txn: any) => (
                                        <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                            <div>
                                                <div className="font-medium">{txn.transactionNumber}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {txn.cashier} • {txn.itemCount} items • {new Date(txn.createdAt).toLocaleDateString('id-ID')}
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
                                <div className="flex h-32 items-center justify-center text-muted-foreground">No transactions this week</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="monthly" className="space-y-4 animate-fade-in">
                    <ReportSummary data={data.monthly} title="Monthly Performance" icon={Calendar} />
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Best Sellers */}
                        <Card>
                             <CardHeader>
                                <CardTitle>Best Selling Products</CardTitle>
                                <CardDescription>Top products this month</CardDescription>
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
                                                    <div className="text-xs text-muted-foreground">{formatCurrency(item.revenue)} revenue</div>
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium">{item.quantitySold || 0} sold</div>
                                        </div>
                                    ))}
                                    {(!data.monthly?.bestSellers || data.monthly.bestSellers.length === 0) && (
                                        <div className="text-center text-muted-foreground py-4">No data available</div>
                                    )}
                                </div>
                             </CardContent>
                        </Card>

                        {/* Payment Methods */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue by Payment Method</CardTitle>
                                <CardDescription>Breakdown by payment type</CardDescription>
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
                                        <div className="text-center text-muted-foreground py-4">No data available</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Transactions */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Recent Transactions</CardTitle>
                                <CardDescription>Latest transactions this month</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {data.monthly?.transactions && data.monthly.transactions.length > 0 ? (
                                    <div className="space-y-3">
                                        {data.monthly.transactions.slice(0, 10).map((txn: any) => (
                                            <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                                <div>
                                                    <div className="font-medium">{txn.transactionNumber}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {txn.cashier} • {txn.itemCount} items • {new Date(txn.createdAt).toLocaleDateString('id-ID')}
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
                                    <div className="flex h-32 items-center justify-center text-muted-foreground">No transactions this month</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
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
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue || 0)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.totalTransactions || 0}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Value</CardTitle>
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
