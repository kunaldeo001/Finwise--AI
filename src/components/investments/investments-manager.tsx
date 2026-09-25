'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PlusCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  Trash2,
  Edit2,
  BookOpen,
  Info,
  Layers,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { Investment, AssetType } from '@/lib/types/finance';
import { addInvestment, updateInvestment, deleteInvestment } from '@/lib/finance/firestore-service';
import { getMarketFeedStatus, fetchQuoteCached } from '@/lib/finance/market-data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ASSET_TYPES: Array<{ value: AssetType; label: string }> = [
  { value: 'stocks', label: 'Stocks / Equities' },
  { value: 'mutual_funds', label: 'Mutual Funds' },
  { value: 'sips', label: 'Systematic Investment Plan (SIP)' },
  { value: 'gold', label: 'Gold & Commodities' },
  { value: 'crypto', label: 'Digital Assets / Crypto' },
  { value: 'other', label: 'Other' },
];

const PIE_COLORS = ['#38bdf8', '#34d399', '#f59e0b', '#ec4899', '#a855f7', '#64748b'];

const EDUCATIONAL_CONCEPTS = [
  {
    title: 'Compounding in SIPs',
    desc: 'Investing fixed sums monthly benefits from Rupee Cost Averaging and exponential compounding over long horizons.',
  },
  {
    title: 'Asset Diversification',
    desc: 'Spreading holdings across equities, debt, and gold minimizes downside volatility during market downturns.',
  },
  {
    title: 'Expense Ratio & Returns',
    desc: 'Direct mutual funds charge lower expense ratios than regular plans, saving tens of thousands in fees over decades.',
  },
  {
    title: 'Beta & Volatility',
    desc: 'A stock with beta > 1.0 swings more than the benchmark index, reflecting higher growth upside alongside higher risk.',
  },
];

export function InvestmentsManager() {
  const finwise = useFinwiseData();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    assetType: 'stocks' as AssetType,
    quantity: '',
    buyPrice: '',
    currentPrice: '',
    notes: '',
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');
  const feedStatus = getMarketFeedStatus();

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    try {
      const symbolsToRefresh = finwise.investments.map((i) => i.symbol).filter(Boolean);
      for (const sym of symbolsToRefresh) {
        await fetchQuoteCached(sym, true);
      }
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      toast({
        title: 'Market Prices Refreshed',
        description: `Quotes synced via ${feedStatus.providerName}. (${feedStatus.isLive ? 'Live API Feed' : 'Simulated Feed'})`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Refresh Error',
        description: 'External provider unreachable, retaining cached quotes.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      symbol: '',
      name: '',
      assetType: 'stocks',
      quantity: '',
      buyPrice: '',
      currentPrice: '',
      notes: '',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (inv: Investment) => {
    setEditingId(inv.id);
    setFormData({
      symbol: inv.symbol,
      name: inv.name,
      assetType: inv.assetType,
      quantity: inv.quantity.toString(),
      buyPrice: inv.buyPrice.toString(),
      currentPrice: inv.currentPrice.toString(),
      notes: inv.notes || '',
    });
    setIsAddOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(formData.quantity);
    const buyP = parseFloat(formData.buyPrice);
    const curP = parseFloat(formData.currentPrice || formData.buyPrice);

    if (isNaN(qty) || qty <= 0 || isNaN(buyP) || buyP <= 0 || !formData.name.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please fill all required values.' });
      return;
    }

    if (!finwise.firestore || !finwise.user?.uid) {
      toast({ title: 'Demo Session', description: 'Investment saved in local session.' });
      setIsAddOpen(false);
      return;
    }

    try {
      if (editingId) {
        await updateInvestment(finwise.firestore, finwise.user.uid, editingId, {
          symbol: formData.symbol.toUpperCase().trim() || formData.name.substring(0, 5).toUpperCase(),
          name: formData.name.trim(),
          assetType: formData.assetType,
          quantity: qty,
          buyPrice: buyP,
          currentPrice: curP,
          investedAmount: qty * buyP,
          currentValue: qty * curP,
          returnAmount: qty * curP - qty * buyP,
          returnPercentage: parseFloat((((curP - buyP) / buyP) * 100).toFixed(2)),
          notes: formData.notes,
        });
        toast({ title: 'Investment Updated' });
      } else {
        await addInvestment(finwise.firestore, finwise.user.uid, {
          symbol: formData.symbol.toUpperCase().trim() || formData.name.substring(0, 5).toUpperCase(),
          name: formData.name.trim(),
          assetType: formData.assetType,
          quantity: qty,
          buyPrice: buyP,
          currentPrice: curP,
          investedAmount: qty * buyP,
          currentValue: qty * curP,
          returnAmount: qty * curP - qty * buyP,
          returnPercentage: parseFloat((((curP - buyP) / buyP) * 100).toFixed(2)),
          notes: formData.notes,
        });
        toast({ title: 'Investment Added', description: `Added ${formData.name} to portfolio.` });
      }
      setIsAddOpen(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!finwise.firestore || !finwise.user?.uid) {
      toast({ title: 'Sample Asset Removed' });
      return;
    }
    try {
      await deleteInvestment(finwise.firestore, finwise.user.uid, id);
      toast({ title: 'Investment Removed' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: err.message });
    }
  };

  // Portfolio calculations
  const totalInvested = finwise.investments.reduce((s, i) => s + (i.investedAmount || 0), 0);
  const currentValue = finwise.investments.reduce((s, i) => s + (i.currentValue || 0), 0);
  const totalGain = currentValue - totalInvested;
  const returnRate = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  // Chart: Allocation data
  const allocationMap: Record<string, number> = {};
  finwise.investments.forEach((inv) => {
    const key = inv.assetType.toUpperCase();
    allocationMap[key] = (allocationMap[key] || 0) + inv.currentValue;
  });
  const pieData = Object.entries(allocationMap).map(([name, value]) => ({ name, value }));

  // Chart: Performance by asset
  const barData = finwise.investments.map((inv) => ({
    name: inv.symbol,
    invested: inv.investedAmount,
    current: inv.currentValue,
  }));

  return (
    <div className="space-y-6">
      {/* Live Market Data Feed Status Banner (Requirement 1, 2, 4) */}
      <div className="bg-card border border-border/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2.5">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-semibold tracking-wider px-2 py-0.5 uppercase gap-1 shrink-0',
              feedStatus.isLive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-accent/15 text-accent border-accent/40'
            )}
          >
            {feedStatus.isLive ? 'LIVE DATA' : 'DEMO / MANUAL DATA'}
          </Badge>
          <div className="space-y-0.5">
            <p className="text-foreground font-medium">
              Provider: <span className="font-semibold">{feedStatus.providerName}</span> • Last updated: {lastRefreshed}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {feedStatus.disclaimer}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefreshPrices}
            disabled={isRefreshing}
            className="h-7 text-xs gap-1.5"
          >
            <RefreshCw className={cn('size-3', isRefreshing && 'animate-spin text-accent')} />
            {isRefreshing ? 'Syncing...' : 'Refresh Prices'}
          </Button>
          <Button onClick={handleOpenAdd} size="sm" className="h-7 text-xs gap-1">
            <PlusCircle className="size-3" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs text-muted-foreground font-medium uppercase">Total Invested</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">
              ₹{totalInvested.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{finwise.investments.length} active holdings</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs text-muted-foreground font-medium uppercase">Current Valuation</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold text-foreground">
              ₹{currentValue.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Live market value</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs text-muted-foreground font-medium uppercase">Total Returns</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div
              className={`text-2xl font-bold flex items-center gap-1 ${
                totalGain >= 0 ? 'text-emerald-400' : 'text-destructive'
              }`}
            >
              {totalGain >= 0 ? <ArrowUpRight className="size-5" /> : <ArrowDownRight className="size-5" />}
              ₹{Math.abs(totalGain).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Absolute profit / loss
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 pb-1">
            <span className="text-xs text-muted-foreground font-medium uppercase">Overall ROI</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div
              className={`text-2xl font-bold ${
                returnRate >= 0 ? 'text-accent' : 'text-destructive'
              }`}
            >
              {returnRate >= 0 ? '+' : ''}{returnRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Portfolio percentage return</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation Pie Chart */}
        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieIcon className="size-4 text-accent" />
              Asset Class Allocation
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of capital across asset classes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', fontSize: '12px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Invested vs Current Bar Chart */}
        <Card className="shadow-sm border border-border/70">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-accent" />
              Invested vs Current Valuation
            </CardTitle>
            <CardDescription className="text-xs">
              Holding comparison across your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', fontSize: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="invested" name="Invested" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="current" name="Current Value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Ledger Table */}
      <Card className="shadow-sm border border-border/70">
        <CardHeader className="p-4 sm:p-6 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Holdings & Assets</CardTitle>
            <CardDescription className="text-xs">
              Manage your stock quantities, purchase costs, and live valuations
            </CardDescription>
          </div>
          <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 h-8">
            <PlusCircle className="size-3.5" />
            Add Asset
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent text-xs">
                <TableHead>Symbol / Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">P&L (%)</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finwise.investments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                    No investment assets logged. Click &quot;Add Asset&quot; to begin tracking your portfolio.
                  </TableCell>
                </TableRow>
              ) : (
                finwise.investments.map((inv) => {
                  const gain = inv.currentValue - inv.investedAmount;
                  const gainPct = inv.investedAmount > 0 ? (gain / inv.investedAmount) * 100 : 0;
                  const isPositive = gain >= 0;

                  return (
                    <TableRow key={inv.id} className="text-xs hover:bg-muted/30">
                      <TableCell>
                        <div className="font-semibold text-foreground">{inv.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{inv.symbol}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] py-0 uppercase">
                          {inv.assetType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{inv.quantity}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        ₹{inv.buyPrice.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{inv.currentPrice.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        ₹{inv.currentValue.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-bold',
                          isPositive ? 'text-emerald-400' : 'text-destructive'
                        )}
                      >
                        <div className="flex items-center justify-end gap-0.5">
                          {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          {gainPct.toFixed(2)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(inv)}
                            className="size-7 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(inv.id)}
                            className="size-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Educational AI Concepts & Disclaimer */}
      <Card className="border border-border/70 bg-card/60 shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="size-3.5 text-accent" />
            Educational Wealth Concepts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {EDUCATIONAL_CONCEPTS.map((c) => (
              <div key={c.title} className="p-3 rounded-lg border bg-card text-xs space-y-1">
                <span className="font-semibold text-accent block">{c.title}</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t flex items-center gap-2 text-[11px] text-muted-foreground/80">
            <Info className="size-3.5 shrink-0" />
            Disclaimer: Educational concepts only. FinWise AI does not provide SEBI-registered financial advisory services or guaranteed investment returns.
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Investment Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Investment' : 'Add Investment Asset'}</DialogTitle>
            <DialogDescription className="text-xs">
              Record purchase price, quantity, and current market quotation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Asset Name</label>
              <Input
                placeholder="e.g. Parag Parikh Flexi Cap, TCS, Gold ETF"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Symbol / Ticker</label>
                <Input
                  placeholder="e.g. PPFAS, TCS, GOLDBEES"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Asset Type</label>
                <Select
                  value={formData.assetType}
                  onValueChange={(val: AssetType) => setFormData({ ...formData, assetType: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Quantity</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="10"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Buy Price (₹)</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="250"
                  value={formData.buyPrice}
                  onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Current Price (₹)</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="290"
                  value={formData.currentPrice}
                  onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {editingId ? 'Save Changes' : 'Add Asset'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
