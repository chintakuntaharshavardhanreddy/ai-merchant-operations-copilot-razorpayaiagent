import { FileText } from "lucide-react";

export interface SourceCitation {
  title: string;
  source: string;
}

interface SourceCitationsProps {
  sources: SourceCitation[];
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-[#1F273A] space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
        <FileText className="w-3 h-3 text-blue-400" />
        <span>Authoritative Sources ({sources.length})</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((src, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D1017] border border-[#212A3E] text-[11px] text-zinc-300 hover:border-blue-500/40 transition-colors"
          >
            <span className="text-blue-400">📄</span>
            <span className="font-medium text-zinc-200">{src.title}</span>
            <span className="text-[10px] font-mono text-zinc-400">({src.source})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
