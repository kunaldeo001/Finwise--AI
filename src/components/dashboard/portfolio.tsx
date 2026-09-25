'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, TrendingUp, ArrowRight } from 'lucide-react';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Portfolio() {
  const { investments } = useFinwiseData();

  return (
    <Card className="shadow-sm border border-border/70">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-accent" />
            Investment Portfolio
          </CardTitle>
          <CardDescription className="text-xs">
            Multi-asset performance across stocks, mutual funds, and gold
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs text-accent gap-1">
          <Link href="/investments">
            View All <ArrowRight className="size-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs">Asset</TableHead>
              <TableHead className="text-xs text-right">Holdings</TableHead>
              <TableHead className="text-xs text-right">Avg Price</TableHead>
              <TableHead className="text-xs text-right">Current Value</TableHead>
              <TableHead className="text-xs text-right">P&L (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                  No investments logged yet. Add your stocks or SIPs in the Investments section.
                </TableCell>
              </TableRow>
            ) : (
              investments.slice(0, 5).map((item) => {
                const gain = item.currentValue - item.investedAmount;
                const gainPct = item.investedAmount > 0 ? (gain / item.investedAmount) * 100 : 0;
                const isPositive = gain >= 0;

                return (
                  <TableRow key={item.id || item.symbol} className="text-xs">
                    <TableCell>
                      <div className="font-semibold text-foreground">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <span className="font-mono">{item.symbol}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-[9px] py-0 px-1 uppercase">
                          {item.assetType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.quantity} units
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ₹{item.buyPrice.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      ₹{item.currentValue.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-semibold',
                        isPositive ? 'text-emerald-400' : 'text-destructive'
                      )}
                    >
                      <div className="flex items-center justify-end gap-0.5">
                        {isPositive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                        {gainPct.toFixed(2)}%
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
  );
}
