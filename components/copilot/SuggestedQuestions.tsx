import {
  TrendingDown,
  XCircle,
  Users,
  FileQuestion,
  Search,
  AlertTriangle,
} from "lucide-react";

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  const suggestions = [
    {
      text: "Why did my revenue drop yesterday?",
      icon: TrendingDown,
      category: "Analytics",
    },
    {
      text: "Show me today's failed payments.",
      icon: XCircle,
      category: "Payments",
    },
    {
      text: "Which customers have repeated payment failures?",
      icon: Users,
      category: "Customers",
    },
    {
      text: "What is our refund policy?",
      icon: FileQuestion,
      category: "Knowledge / RAG",
    },
    {
      text: "Find unusual payment activity.",
      icon: Search,
      category: "Anomaly Detection",
    },
    {
      text: "What revenue is currently at risk?",
      icon: AlertTriangle,
      category: "Risk & Recovery",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Suggested Investigations
        </span>
        <span className="text-[11px] text-zinc-400">Click to load prompt</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {suggestions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.text}
              onClick={() => onSelect(item.text)}
              className="text-left p-3 rounded-xl bg-[#10141D] border border-[#1E2638] hover:border-blue-500/40 hover:bg-[#141926] transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1 rounded bg-[#171D2B] text-zinc-400 group-hover:text-blue-400 transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  {item.category}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-medium group-hover:text-white transition-colors leading-snug">
                {item.text}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
