
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown } from "lucide-react";
import { portfolioItems } from "@/lib/placeholder-data";
import { cn } from "@/lib/utils";

export function Portfolio() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Portfolio</CardTitle>
        <CardDescription>Track your investment performance across various assets.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {portfolioItems.map((item) => (
              <TableRow key={item.symbol}>
                <TableCell>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.symbol}</div>
                </TableCell>
                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                <TableCell
                  className={cn(
                    "text-right flex items-center justify-end gap-1",
                    item.change > 0 ? "text-accent" : "text-destructive"
                  )}
                >
                  {item.change > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  {item.change.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">${item.value.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
