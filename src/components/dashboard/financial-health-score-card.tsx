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
import { cn } from '@/lib/utils';
import { FinancialHealthScore } from '@/lib/types/finance';

interface FinancialHealthScoreCardProps {
  score: FinancialHealthScore;
}

export function FinancialHealthScoreCard({ score }: FinancialHealthScoreCardProps) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  // Score color configuration per Section 7
  const getScoreTheme = (val: number) => {
    if (val >= 80) {
      return {
        color: '#10B981',
        strokeClass: 'stroke-emerald-400',
        textClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        glow: 'rgba(16, 185, 129, 0.15)',
      };
    }
    if (val >= 60) {
      return {
        color: '#0EA5E9',
        strokeClass: 'stroke-sky-400',
        textClass: 'text-sky-400',
        bgClass: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
        glow: 'rgba(14, 165, 233, 0.15)',
      };
    }
    if (val >= 40) {
      return {
        color: '#F59E0B',
        strokeClass: 'stroke-amber-400',
        textClass: 'text-amber-400',
        bgClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        glow: 'rgba(245, 158, 11, 0.15)',
      };
    }
    return {
      color: '#EF4444',
      strokeClass: 'stroke-rose-400',
      textClass: 'text-rose-400',
      bgClass: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      glow: 'rgba(239, 68, 68, 0.15)',
    };
  };

  const scoreTheme = getScoreTheme(score.overallScore);
  const ringRadius = 48;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringCircumference - (Math.min(100, Math.max(0, score.overallScore)) / 100) * ringCircumference;

  const factorList = [
    { key: 'savingsRate', name: 'Savings Rate', f: score.factors.savingsRate, color: 'bg-emerald-500' },
    { key: 'budgetDiscipline', name: 'Budget Discipline', f: score.factors.budgetDiscipline, color: 'bg-blue-500' },
    { key: 'emergencyFundCoverage', name: 'Emergency Cushion', f: score.factors.emergencyFundCoverage, color: 'bg-teal-500' },
    { key: 'debtBurden', name: 'Debt Burden', f: score.factors.debtBurden, color: 'bg-amber-500' },
    { key: 'goalProgress', name: 'Goal Velocity', f: score.factors.goalProgress, color: 'bg-violet-500' },
  ];

  return (
    <Card className="overflow-hidden border border-border/70 shadow-sm relative">
      <CardHeader className="pb-3 border-b bg-card/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xs">
              <ShieldCheck className="size-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                Financial Health Score 2.0
                <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-bold ${scoreTheme.bgClass}`}>
                  {score.rating}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Transparent mathematical composite across 5 verified financial health pillars
              </CardDescription>
            </div>
          </div>

          {/* Historical Score Progression & Delta Attribution (Requirement 12) */}
          {score.historicalTrend && score.historicalTrend.length >= 2 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs bg-secondary/60 px-3 py-1.5 rounded-lg border border-border/60">
              <div className="flex items-center gap-1.5 font-medium">
                <History className="size-3.5 text-emerald-400" />
                <span className="text-muted-foreground text-[11px]">Trend:</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  {score.historicalTrend.map((h, i) => (
                    <span key={h.month} className="flex items-center gap-1">
                      <span className={i === score.historicalTrend.length - 1 ? 'font-bold text-emerald-400' : 'text-muted-foreground'}>
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
                  <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l sm:pl-2 border-border/60 text-[11px]">
                    <span className={delta >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {delta >= 0 ? `+${delta}` : delta} pts MoM
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Prominent Circular / Ring Visualization + Composite Narrative */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-secondary/30 rounded-xl p-4 sm:p-5 border border-border/60">
          {/* Radial Ring Gauge */}
          <div className="md:col-span-4 flex flex-col items-center justify-center relative">
            <div className="relative size-36 flex items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                {/* Background track circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={ringRadius}
                  className="stroke-muted/50 fill-none"
                  strokeWidth="9"
                />
                {/* Animated progress ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={ringRadius}
                  className={cn('fill-none transition-all duration-700 ease-out', scoreTheme.strokeClass)}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>

              {/* Centered Score */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold tracking-tight text-foreground font-sans tabular-nums">
                  {score.overallScore}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  out of 100
                </span>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className={`text-xs font-bold uppercase tracking-wider ${scoreTheme.textClass}`}>
                ● {score.rating} Health
              </span>
            </div>
          </div>

          {/* Core Strengths & Insights beside Ring */}
          <div className="md:col-span-8 space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Holistic Financial Health Evaluation</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Your score combines liquidity coverage, savings velocity, debt service ratios, and milestone tracking into an objective financial index.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {score.keyStrengths.length > 0 && (
                <div className="flex items-start gap-2 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <span className="font-semibold text-emerald-400">Strengths: </span>
                    <span className="text-foreground/90">{score.keyStrengths.join(', ')}</span>
                  </div>
                </div>
              )}

              {score.areasToImprove.length > 0 && (
                <div className="flex items-start gap-2 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                  <AlertTriangle className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <span className="font-semibold text-amber-400">Action Plan: </span>
                    <span className="text-foreground/90">{score.areasToImprove.join(', ')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5 Pillars Breakdown with Semantic Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
          {factorList.map(({ key, name, f, color }) => (
            <div
              key={key}
              onClick={() => setExpandedPillar(expandedPillar === key ? null : key)}
              className="p-3 rounded-xl border border-border/70 bg-card hover:border-emerald-500/40 hover:bg-secondary/40 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground font-medium truncate text-[11px]">{name}</span>
                  <span className="font-bold text-xs font-mono">
                    {f.score}/{f.max}
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground truncate">{f.valueDisplay}</div>
                <div className="mt-2">
                  <Progress
                    value={(f.score / f.max) * 100}
                    className="h-1.5 bg-muted/70"
                    indicatorClassName={color}
                  />
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="truncate">{f.benchmark}</span>
                {expandedPillar === key ? (
                  <ChevronUp className="size-3 text-emerald-400" />
                ) : (
                  <ChevronDown className="size-3 group-hover:text-foreground transition-colors" />
                )}
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
