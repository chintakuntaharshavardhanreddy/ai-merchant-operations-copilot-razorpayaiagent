"use client";

import React, { ReactNode } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses inline formatting: bold (**text**), inline code (`code`), italic (*text*).
 */
function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // Match **bold**, `code`, or *italic*
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-zinc-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="font-mono text-[11px] bg-white/[0.08] px-1 py-0.5 rounded text-blue-300"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic text-zinc-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Dependency-free React Markdown renderer designed for Copilot responses.
 * Preserves headings, bold text, numbered lists, bullet lists, code blocks,
 * blockquotes, horizontal rules, and paragraphs.
 */
export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1 my-1.5">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-zinc-300">
              <span className="text-zinc-500 select-none mt-0.5">•</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${elements.length}`} className="space-y-1 my-1.5">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-zinc-300">
              <span className="font-mono text-[10px] text-zinc-500 select-none mt-0.5">
                {idx + 1}.
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block delimiter
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        flushList();
        elements.push(
          <pre
            key={`code-${elements.length}`}
            className="p-3 my-2 rounded-md bg-[#080a0f] border border-white/[0.08] font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed"
          >
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Blank line
    if (!trimmed) {
      flushList();
      continue;
    }

    // Horizontal rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      flushList();
      elements.push(<hr key={`hr-${elements.length}`} className="border-white/[0.08] my-3" />);
      continue;
    }

    // Headings
    if (trimmed.startsWith("#### ")) {
      flushList();
      elements.push(
        <h4
          key={`h4-${elements.length}`}
          className="text-xs font-bold text-zinc-200 uppercase tracking-wider mt-3 mb-1 font-mono"
        >
          {renderInline(trimmed.slice(5))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3
          key={`h3-${elements.length}`}
          className="text-sm font-semibold text-zinc-100 tracking-tight mt-3 mb-1"
        >
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={`h2-${elements.length}`}
          className="text-sm font-bold text-zinc-100 tracking-tight mt-3.5 mb-1.5 pb-1 border-b border-white/[0.06]"
        >
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1
          key={`h1-${elements.length}`}
          className="text-base font-bold text-zinc-100 tracking-tight mt-4 mb-2"
        >
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote
          key={`bq-${elements.length}`}
          className="border-l-2 border-blue-500/50 pl-3 my-2 text-xs text-zinc-400 italic bg-white/[0.02] py-1 rounded-r"
        >
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Unordered list item (- or *)
    const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Ordered list item (1. or 1))
    const olMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${elements.length}`} className="text-xs text-zinc-200 leading-relaxed my-1.5">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
