"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Database,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { SourceCitations, SourceCitation } from "./SourceCitations";
import type { ActivityStep } from "./AIActivityPanel";
import type { AgentActionRecord } from "@/lib/db/queries";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: SourceCitation[];
  toolsUsed?: string[];
  actionProposal?: AgentActionRecord | null;
  isError?: boolean;
}

interface ChatInterfaceProps {
  onTraceUpdate?: (trace: ActivityStep[], tools: string[], loading: boolean) => void;
  onActionProposal?: (proposal: AgentActionRecord | null) => void;
  initialQuery?: string | null;
}

export function ChatInterface({ onTraceUpdate, onActionProposal, initialQuery }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const initialQuerySent = useRef(false);

  const handleSendQuery = useCallback(async (queryText: string) => {
    const text = queryText.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    onTraceUpdate?.(
      [
        {
          step: "Analyzing merchant request",
          detail: `Evaluating intent: "${text.slice(0, 50)}${text.length > 50 ? "..." : ""}"`,
          time: "15ms",
          completed: true,
        },
        {
          step: "Selecting operational tools",
          detail: "Evaluating telemetry rails & knowledge search...",
          time: "...",
          completed: false,
        },
      ],
      [],
      true
    );

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate operational response.");
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer || "No response generated.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sources: data.sources || [],
        toolsUsed: data.toolsUsed || [],
        actionProposal: data.actionProposal || null,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.actionProposal) {
        onActionProposal?.(data.actionProposal);
      }

      if (data.executionTrace && Array.isArray(data.executionTrace)) {
        onTraceUpdate?.(data.executionTrace, data.toolsUsed || [], false);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unknown communication error";
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${errMsg}. Please ensure your GEMINI_API_KEY is configured in .env.local and try again.`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMsg]);

      onTraceUpdate?.(
        [
          {
            step: "Agent execution failed",
            detail: errMsg,
            time: "0ms",
            completed: false,
            error: true,
          },
        ],
        [],
        false
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onTraceUpdate, onActionProposal]);

  // Handle ?q= initial query from dashboard handoff
  useEffect(() => {
    if (initialQuery && !initialQuerySent.current) {
      initialQuerySent.current = true;
      handleSendQuery(initialQuery);
    }
  }, [initialQuery, handleSendQuery]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSendQuery(input);
  };

  const handleSelectQuestion = (q: string) => {
    handleSendQuery(q);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] rounded-2xl bg-[#0C0F17] border border-[#1B2232] overflow-hidden shadow-2xl relative">
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b border-[#1A2233] bg-[#0E131E]/60 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-zinc-200">
            Autonomous Copilot Agent
          </span>
          <Badge variant="ai" size="sm">
            Gemini 2.5
          </Badge>
          <Badge variant="neutral" size="sm">
            Human-in-the-Loop
          </Badge>
        </div>
        <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
          Live Telemetry + RAG Policy
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4 my-auto py-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
              <Bot className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-zinc-100">
                Autonomous Merchant Operations Copilot Ready
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
                Ask operational questions to investigate revenue drops, diagnose failed payments across rails, inspect repeat customer friction, check pending refunds, or propose controlled operational actions.
              </p>
            </div>

            {/* Suggested Questions Grid */}
            <div className="w-full text-left pt-2">
              <SuggestedQuestions onSelect={handleSelectQuestion} />
            </div>
          </div>
        ) : (
          /* Active Message Thread */
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10 rounded-br-sm"
                      : msg.isError
                      ? "bg-rose-950/40 text-rose-200 border border-rose-800/40 rounded-bl-sm"
                      : "bg-[#121622] text-zinc-200 border border-[#1F273A] shadow-sm rounded-bl-sm space-y-2"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-normal leading-relaxed">
                    {msg.content}
                  </div>

                  {/* Action Proposal Banner */}
                  {msg.actionProposal && (
                    <div className="mt-3 p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/40 flex items-center justify-between text-[11px] text-blue-200">
                      <div className="flex items-center gap-2 truncate">
                        <ShieldAlert className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="font-semibold truncate">
                          Proposal: {msg.actionProposal.title}
                        </span>
                      </div>
                      <Badge variant="ai" size="sm" className="shrink-0">
                        {msg.actionProposal.status}
                      </Badge>
                    </div>
                  )}

                  {/* Grounded Source Citations (Only shown when RAG was used) */}
                  {msg.sources && msg.sources.length > 0 && (
                    <SourceCitations sources={msg.sources} />
                  )}

                  {/* Telemetry Evidence Notice */}
                  {msg.toolsUsed &&
                    msg.toolsUsed.length > 0 &&
                    (!msg.sources || msg.sources.length === 0) && (
                      <div className="mt-3 pt-2 border-t border-[#1F273A] flex items-center gap-1.5 text-[10px] text-zinc-400">
                        <Database className="w-3 h-3 text-blue-400" />
                        <span>
                          Grounded on live merchant telemetry ({msg.toolsUsed.length} tools executed)
                        </span>
                      </div>
                    )}

                  <div
                    className={`flex items-center justify-between pt-1 text-[10px] ${
                      msg.role === "user" ? "text-blue-200" : "text-zinc-400"
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.role === "assistant" && !msg.isError && (
                      <span className="font-mono text-[9px] bg-[#1A2234] text-zinc-400 px-1.5 py-0.5 rounded border border-[#232F47]">
                        {msg.actionProposal
                          ? "Action Proposed"
                          : msg.sources && msg.sources.length > 0
                          ? "RAG + Telemetry"
                          : "Telemetry Verified"}
                      </span>
                    )}
                  </div>
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-[#161C27] border border-[#232C3E] flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading State Animation */}
            {isLoading && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-[#121622] text-zinc-300 border border-[#1F273A] rounded-2xl rounded-bl-sm p-4 text-xs flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span>Investigating telemetry and determining operational recommendations...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 border-t border-[#1A2233] bg-[#0E121B]">
        <form onSubmit={handleFormSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask Copilot (e.g. 'Prepare a recovery plan for repeated failure customers' or 'Why did revenue drop?')..."
            className="w-full bg-[#141926] border border-[#222C42] rounded-xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 pr-12 transition-all disabled:opacity-60"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="sm"
            className="absolute right-1.5 h-8 w-8 !p-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600"
          >
            {isLoading ? (
              <Sparkles className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-3.5 h-3.5 text-white" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
