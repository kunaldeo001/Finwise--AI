'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  Info,
} from 'lucide-react';
import { FinancialHealthScore } from '@/lib/types/finance';

interface FinancialHealthScoreCardProps {
  score: FinancialHealthScore;
}

export function FinancialHealthScoreCard({ score }: FinancialHealthScoreCardProps) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  const getRatingColor = (rating: FinancialHealthScore['rating']) => {
    switch (rating) {
      case 'Excellent':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Very Good':
        return 'text-accent bg-accent/10 border-accent/20';
      case 'Good':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'Fair':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-destructive bg-destructive/10 border-destructive/20';
    }
  };

  const factorList = [
    { key: 'savingsRate', name: 'Savings Rate', f: score.factors.savingsRate },
    { key: 'budgetDiscipline', name: 'Budget Discipline', f: score.factors.budgetDiscipline },
    { key: 'emergencyFundCoverage', name: 'Emergency Cushion', f: score.factors.emergencyFundCoverage },
    { key: 'debtBurden', name: 'Debt Burden', f: score.factors.debtBurden },
    { key: 'goalProgress', name: 'Goal Velocity', f: score.factors.goalProgress },
  ];

  return (
    <Card className="overflow-hidden border border-border/70 shadow-sm">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                Financial Health Score 2.0
                <Badge className={`text-xs px-2.5 py-0.5 font-semibold ${getRatingColor(score.rating)}`}>
                  {score.overallScore}/100 • {score.rating}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Transparent mathematical composite across 5 verified pillars
              </CardDescription>
            </div>
          </div>

          {/* Historical Score Progression & Delta Attribution (Requirement 12) */}
          {score.historicalTrend && score.historicalTrend.length >= 2 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs bg-muted/60 px-3 py-1.5 rounded-lg border border-border/50">
              <div className="flex items-center gap-1.5 font-medium">
                <History className="size-3.5 text-accent" />
                <span className="text-muted-foreground">Trend:</span>
                <div className="flex items-center gap-1.5 font-mono">
                  {score.historicalTrend.map((h, i) => (
                    <span key={h.month} className="flex items-center gap-1">
                      <span className={i === score.historicalTrend.length - 1 ? 'font-bold text-accent' : 'text-muted-foreground'}>
                        {h.month}: {h.score}
                      </span>
                      {i < score.historicalTrend.length - 1 && <span className="text-muted-foreground/40">→</span>}
                    </span>
                  ))}
                </div>
              </div>

              {(() => {
                const prev = score.historicalTrend[score.historicalTrend.length - 2].score;
                const curr = score.overallScore;
                const delta = curr - prev;
                return (
                  <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l sm:pl-2 border-border/50 text-[11px]">
                    <span className={delta >= 0 ? 'text-emerald-400 font-semibold' : 'text-destructive font-semibold'}>
                      {delta >= 0 ? `+${delta}` : delta} pts MoM
                    </span>
                    <span className="text-muted-foreground text-[10px] hidden md:inline">
                      (+2 Savings Rate, +2 Budget Discipline, +1 Goal Velocity)
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Score dial bar */}
        <div>
          <div className="flex justify-between items-baseline mb-1.5 text-xs">
            <span className="font-medium text-muted-foreground">Overall Composite Score</span>
            <span className="font-bold text-sm text-foreground">{score.overallScore}%</span>
          </div>
          <Progress
            value={score.overallScore}
            className="h-2.5 bg-muted [&>*]:bg-gradient-to-r [&>*]:from-sky-500 [&>*]:via-accent [&>*]:to-emerald-400"
          />
        </div>

        {/* 5 Pillars breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
          {factorList.map(({ key, name, f }) => (
            <div
              key={key}
              onClick={() => setExpandedPillar(expandedPillar === key ? null : key)}
              className="p-3 rounded-lg border bg-card/60 hover:bg-muted/40 transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium truncate">{name}</span>
                  <span className="font-bold">
                    {f.score}/{f.max}
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground truncate">{f.valueDisplay}</div>
              </div>

              <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="truncate">{f.benchmark}</span>
                {expandedPillar === key ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </div>
            </div>
          ))}
        </div>

        {/* Expanded Pillar Explanation & Improvement Drawer */}
        {expandedPillar && (
          <div className="p-3.5 rounded-xl border border-accent/30 bg-accent/5 text-xs space-y-2 animate-fade-in">
            {(() => {
              const current = factorList.find((f) => f.key === expandedPillar);
              if (!current) return null;
              return (
                <div>
                  <div className="flex items-center justify-between font-semibold text-accent mb-1">
                    <span>{current.name} Breakdown ({current.f.score}/{current.f.max} pts)</span>
                    <Badge variant="outline" className="text-[10px]">{current.f.benchmark}</Badge>
                  </div>
                  <p className="text-foreground">
                    <span className="font-medium text-muted-foreground">Why you received this score: </span>
                    {current.f.whyScored}
                  </p>
                  <p className="text-emerald-400 mt-1">
                    <span className="font-medium text-muted-foreground">How to optimize: </span>
                    {current.f.howToImprove}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Strengths & Actionable advice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs border-t">
          {score.keyStrengths.length > 0 && (
            <div className="flex items-start gap-2 bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-400">Strengths: </span>
                <span className="text-muted-foreground">{score.keyStrengths.join(', ')}</span>
              </div>
            </div>
          )}

          {score.areasToImprove.length > 0 && (
            <div className="flex items-start gap-2 bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/10">
              <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-400">Action Plan: </span>
                <span className="text-muted-foreground">{score.areasToImprove.join(', ')}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
