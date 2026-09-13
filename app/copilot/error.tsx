"use client";

import { useEffect } from "react";
import { Sparkles, RotateCcw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function CopilotError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Copilot ErrorBoundary] Error:", error.message);
  }, [error]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#090A0F]">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-blue-400" />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-100">
              Copilot Encountered an Error
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              The AI Operations Copilot experienced an unexpected issue.
              Your conversation history may be preserved after recovery.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-100 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart Copilot
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-300 bg-[#141824] hover:bg-[#1A2030] border border-[#222B3E] rounded-lg transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          </div>

          {error.digest && (
            <p className="text-[10px] text-zinc-500 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
