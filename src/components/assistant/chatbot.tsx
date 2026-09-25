'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { generateChatResponse } from '@/app/assistant/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, User, Sparkles, Database, AlertCircle, RefreshCw, ArrowRight, ExternalLink } from 'lucide-react';
import { useFinwiseData } from '@/hooks/use-finwise-data';
import { useToast } from '@/hooks/use-toast';
import {
  generateProvenance,
  generateSuggestedActions,
  DataProvenance,
  EpistemicTag,
  AIActionSuggestion,
} from '@/lib/finance/provenance';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  dataUsed?: string;
  provenance?: DataProvenance;
  epistemicTag?: EpistemicTag;
  actions?: AIActionSuggestion[];
  followUps?: string[];
  timestamp: string;
}

const SAMPLE_QUERIES = [
  'How much did I spend on food?',
  'Why?',
  'How can I reduce it?',
  'Can I afford a ₹50,000 laptop?',
  'What are my biggest expenses?',
  'Show me my financial health.',
  'Which subscriptions am I paying for?',
];

export function Chatbot() {
  const finwise = useFinwiseData();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I'm your FinWise Personal Finance Copilot 2.0. I maintain full context across our conversation and have access to your live financial snapshot (₹${finwise.totals.currentMonthExpenses.toLocaleString('en-IN')} expenses, ₹${finwise.totals.currentMonthIncome.toLocaleString('en-IN')} income, and active budgets). How can I assist you with your money today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      followUps: ['How much did I spend on food?', 'Can I afford a ₹50,000 laptop?', 'Where am I overspending?'],
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isPending, setIsPending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  const handleSendMessage = async (queryToSend: string) => {
    const trimmed = queryToSend.trim();
    if (!trimmed || isPending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputQuery('');
    setIsPending(true);

    // Prepare conversational history payload (last 8 turns for context)
    const historyPayload = newMessages.slice(-8).map((m) => ({
      role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.text,
    }));

    const snapshot = {
      totals: finwise.totals,
      budgets: finwise.budgets,
      goals: finwise.goals,
      investments: finwise.investments,
      debts: finwise.debts,
      healthScore: finwise.healthScore,
      transactions: finwise.transactions.slice(0, 40),
    };

    const formData = new FormData();
    formData.append('query', trimmed);
    formData.append('userData', JSON.stringify(snapshot));
    formData.append('history', JSON.stringify(historyPayload));

    try {
      const responseState = await generateChatResponse(
        { success: false, message: '', response: null, query: trimmed },
        formData
      );

      if (responseState.success && responseState.response) {
        const provenance = generateProvenance(finwise.transactions);
        let epistemicTag: EpistemicTag = 'CALCULATED';
        const qLower = trimmed.toLowerCase();
        if (qLower.includes('project') || qLower.includes('afford') || qLower.includes('future') || qLower.includes('forecast')) {
          epistemicTag = 'ESTIMATE';
        } else if (qLower.includes('why') || qLower.includes('how') || qLower.includes('advice') || qLower.includes('reduce')) {
          epistemicTag = 'AI-EXPLANATION';
        } else if (qLower.includes('spend') || qLower.includes('food') || qLower.includes('paid') || qLower.includes('balance')) {
          epistemicTag = 'RECORDED';
        }

        const actions = generateSuggestedActions(trimmed, responseState.response);

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: responseState.response,
          dataUsed: responseState.dataUsedExplanation || undefined,
          provenance,
          epistemicTag,
          actions,
          followUps: responseState.suggestedFollowUps || undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        toast({
          variant: 'destructive',
          title: 'Copilot Notice',
          description: responseState.message || 'Unable to process query.',
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to contact financial copilot service.',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Quick query chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-accent" />
          Conversational Queries:
        </span>
        {SAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => handleSendMessage(q)}
            disabled={isPending}
            className="text-xs bg-muted/60 hover:bg-muted text-foreground border border-border/80 rounded-full px-3 py-1 transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Main Chat Conversation Card */}
      <Card className="flex flex-col h-[650px] shadow-sm">
        <CardHeader className="border-b py-3 px-6 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Bot className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                FinWise AI Copilot 2.0
                <Badge variant="outline" className="text-[10px] text-accent border-accent/40 bg-accent/5">
                  Multi-Turn Session Active
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Context-aware financial reasoning assistant backed by your actual transactions & budgets
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setMessages([
                {
                  id: 'reset',
                  sender: 'assistant',
                  text: 'Conversation reset. How can I help you analyze your finances today?',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ])
            }
            className="text-xs text-muted-foreground"
          >
            <RefreshCw className="size-3 mr-1" />
            Clear
          </Button>
        </CardHeader>

        {/* Messages Feed */}
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent/20 text-accent'
                }`}
              >
                {msg.sender === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
              </div>

              <div className="flex flex-col gap-1.5 max-w-full">
                {/* Epistemic Confidence Tag */}
                {msg.epistemicTag && (
                  <Badge
                    variant="outline"
                    className={`text-[9px] py-0 px-1.5 font-mono tracking-wider w-fit ${
                      msg.epistemicTag === 'RECORDED'
                        ? 'text-blue-400 border-blue-500/30 bg-blue-500/10'
                        : msg.epistemicTag === 'CALCULATED'
                        ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                        : msg.epistemicTag === 'ESTIMATE'
                        ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                        : 'text-accent border-accent/30 bg-accent/10'
                    }`}
                  >
                    {msg.epistemicTag}
                  </Badge>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-card border border-border/80 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Data Provenance Metadata (Requirement 8) */}
                {msg.provenance && (
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-2.5 text-[11px] text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1 font-semibold text-foreground text-[10px] uppercase tracking-wider">
                      <Database className="size-3 text-accent" />
                      Data Lineage:
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                      <div>Analyzed: <span className="font-semibold text-foreground">{msg.provenance.transactionsCount} transactions</span></div>
                      <div>Period: <span className="font-semibold text-foreground">{msg.provenance.periodAnalyzed}</span></div>
                      <div>Outflow: <span className="font-semibold text-foreground">₹{msg.provenance.totalExpensesAnalyzed.toLocaleString('en-IN')}</span></div>
                      <div>Scope: <span className="font-semibold text-foreground">{msg.provenance.categoriesCovered.slice(0, 3).join(', ')}</span></div>
                    </div>
                  </div>
                )}

                {/* Actionable Suggestions (Requirement 10) */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {msg.actions.map((act) => (
                      <Button
                        key={act.route}
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-7 text-xs gap-1 border-accent/40 text-accent hover:bg-accent/10"
                      >
                        <Link href={act.route}>
                          <span>{act.label}</span>
                          <ArrowRight className="size-3" />
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Explanation badge of data referenced */}
                {msg.dataUsed && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
                    <Database className="size-3 text-accent" />
                    <span>{msg.dataUsed}</span>
                  </div>
                )}

                {/* Follow-up question chips */}
                {msg.followUps && msg.followUps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1 pt-1">
                    {msg.followUps.map((fu) => (
                      <button
                        key={fu}
                        onClick={() => handleSendMessage(fu)}
                        className="text-[11px] text-accent hover:underline bg-accent/10 border border-accent/20 rounded-md px-2 py-0.5"
                      >
                        ↳ {fu}
                      </button>
                    ))}
                  </div>
                )}

                <span
                  className={`text-[10px] text-muted-foreground px-1 ${
                    msg.sender === 'user' ? 'text-right' : ''
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isPending && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="size-8 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
                <Bot className="size-4" />
              </div>
              <div className="bg-card border border-border/80 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-accent" />
                Reasoning across your financial history...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Bar & Disclaimer */}
        <div className="border-t p-4 bg-muted/20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputQuery);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything or follow up with 'Why?' or 'How can I reduce it?'..."
              className="flex-1 bg-background"
              disabled={isPending}
            />
            <Button type="submit" disabled={isPending || !inputQuery.trim()} className="shrink-0">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>

          <p className="text-[11px] text-muted-foreground/80 mt-2 flex items-center gap-1">
            <AlertCircle className="size-3 shrink-0" />
            FinWise AI provides educational insights only and is not a registered financial advisor or SEBI entity.
          </p>
        </div>
      </Card>
    </div>
  );
}
