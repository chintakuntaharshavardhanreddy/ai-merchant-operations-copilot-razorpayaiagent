"use client";

import { useState } from "react";
import {
  Sparkles,
  User,
  Bot,
  Loader2,
  RefreshCw,
  Info,
  CornerDownLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SuggestedQuestions } from "./SuggestedQuestions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isPlaceholder?: boolean;
}

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSampleThread, setShowSampleThread] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const sampleMessages: Message[] = [
    {
      id: "sample-1",
      role: "user",
      content: "Why did my revenue drop yesterday?",
      timestamp: "10:14 AM",
    },
    {
      id: "sample-2",
      role: "assistant",
      content:
        "Yesterday's settled revenue was ₹12.4L, down 7.4% against the trailing 7-day average of ₹13.4L.\n\nKey Findings:\n1. UPI Rail Degradation: SBI and HDFC bank handles experienced a 4.1% spike in gateway timeouts (error U30) between 17:30 and 19:00 IST, resulting in approximately ₹46,200 in unrecovered dropped checkouts.\n2. Card 3DS Verification Drop: 27 customer checkouts experienced consecutive 3DS timeout failures on international cards.\n\nRecommended Action: Route SBI UPI transactions through backup Axis gateway router and initiate recovery alerts for high-intent customers.",
      timestamp: "10:15 AM",
      isPlaceholder: true,
    },
  ];

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Trigger simulated loading state to demonstrate the UI loading state
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Informative notice as requested: "Do NOT implement fake AI responses. The chat functionality will be implemented in a later phase."
      const placeholderNotice: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "AI Agent backend ready. Live streaming with Google Gemini (@ai-sdk/google) and Supabase tool calling will be wired in Phase 2. Your query was logged to the operational context.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isPlaceholder: true,
      };
      setMessages((prev) => [...prev, placeholderNotice]);
    }, 1200);
  };

  const handleSelectQuestion = (q: string) => {
    setInput(q);
  };

  const activeThread = showSampleThread ? sampleMessages : messages;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-[#0A0D14] border border-[#1E2638] rounded-2xl overflow-hidden shadow-2xl">
      {/* Chat Sub-Header / Controls */}
      <div className="px-6 py-3 border-b border-[#1A2233] bg-[#0E121B]/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-200">
                Agent Session #COP-4921
              </span>
              <Badge variant="ai" size="sm">
                Gemini 2.5 Pro
              </Badge>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              Tools active: get_payment, search_payments, search_knowledge_base
            </span>
          </div>
        </div>

        {/* Toggle Sample Thread / Empty State */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSampleThread(!showSampleThread)}
            className="text-[11px] px-2.5 py-1 rounded bg-[#151B27] hover:bg-[#1C2433] text-zinc-300 border border-[#232D40] transition-colors"
          >
            {showSampleThread ? "Show Current State" : "Preview Sample Thread"}
          </button>
          {messages.length > 0 && !showSampleThread && (
            <button
              onClick={() => setMessages([])}
              className="p-1.5 rounded hover:bg-[#1C2433] text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Reset Chat"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeThread.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-6 py-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
              <Bot className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-zinc-100">
                Operational Payment Assistant Ready
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
                Ask questions to investigate payment drops, inspect gateway latencies, evaluate refund rules, or draft customer recovery actions.
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
            {activeThread.map((msg) => (
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
                      : "bg-[#121622] text-zinc-200 border border-[#1F273A] shadow-sm rounded-bl-sm space-y-2"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-normal">
                    {msg.content}
                  </div>

                  <div
                    className={`flex items-center justify-between pt-1 text-[10px] ${
                      msg.role === "user" ? "text-blue-200" : "text-zinc-400"
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.isPlaceholder && (
                      <span className="font-mono text-[9px] bg-[#1A2234] text-zinc-400 px-1.5 py-0.2 rounded border border-[#232F47]">
                        Phase 2 Shell
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
                  <div className="space-y-0.5">
                    <span className="font-medium text-zinc-200 block">
                      Investigating operational query...
                    </span>
                    <span className="text-[10px] text-zinc-400 block font-mono">
                      Querying tools & payment logs
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#1A2233] bg-[#0C1017]">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto space-y-2">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask questions about payments, revenue, refunds, settlements..."
              className="w-full pl-4 pr-24 py-3 bg-[#121622] border border-[#212A3E] focus:border-blue-500 focus:outline-none rounded-xl text-xs text-zinc-100 placeholder:text-zinc-400 transition-colors shadow-inner"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isLoading}
                className="h-8 px-3"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline mr-1">Ask</span>
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              Direct access to payment telemetry, RAG knowledge docs & audit logs
            </span>
            <span className="hidden sm:inline font-mono">
              Press Enter ↵ to send
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
