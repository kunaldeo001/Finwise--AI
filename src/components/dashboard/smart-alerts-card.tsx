'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, AlertCircle, CheckCircle, Info, ArrowRight, Check } from 'lucide-react';
import { SmartAlert } from '@/lib/types/finance';
import Link from 'next/link';

interface SmartAlertsCardProps {
  alerts: SmartAlert[];
  onMarkRead?: (id: string) => void;
}

export function SmartAlertsCard({ alerts, onMarkRead }: SmartAlertsCardProps) {
  const getAlertIcon = (type: SmartAlert['type']) => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />;
      case 'success':
        return <CheckCircle className="size-4 text-emerald-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="size-4 text-sky-400 shrink-0 mt-0.5" />;
    }
  };

  const getAlertBadgeClass = (type: SmartAlert['type']) => {
    switch (type) {
      case 'danger':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    }
  };

  const unreadAlerts = alerts.filter((a) => !a.read);

  return (
    <Card className="overflow-hidden border border-border/70 shadow-sm">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Bell className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                Smart Alerts
                {unreadAlerts.length > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-4 px-1.5 font-bold">
                    {unreadAlerts.length} New
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time notifications on budgets, spikes, and loan dates
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-border">
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No active alerts. All financial parameters are within safe ranges!
          </div>
        ) : (
          alerts.slice(0, 4).map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 flex items-start justify-between gap-3 hover:bg-muted/30 transition-colors ${
                !alert.read ? 'bg-accent/5' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.type)}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{alert.title}</span>
                    <Badge variant="outline" className={`text-[9px] px-1 py-0 ${getAlertBadgeClass(alert.type)}`}>
                      {alert.category.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{alert.message}</p>
                  <span className="text-[10px] text-muted-foreground/70 block">{alert.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {alert.actionUrl && (
                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs px-2 gap-1 text-accent">
                    <Link href={alert.actionUrl}>
                      View <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                )}
                {!alert.read && onMarkRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onMarkRead(alert.id)}
                    title="Mark as read"
                    className="size-7 text-muted-foreground hover:text-foreground"
                  >
                    <Check className="size-3" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
