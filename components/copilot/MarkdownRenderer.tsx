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
 * Splits a table row by pipe delimiter, handling optional leading/trailing pipes and escaped pipes.
 */
function parseTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  // Mask escaped pipes
  const masked = trimmed.replace(/\\\|/g, "__ESCAPED_PIPE__");
  return masked
    .split("|")
    .map((cell) => cell.replace(/__ESCAPED_PIPE__/g, "|").trim());
}

/**
 * Checks if a line is a markdown table separator row (e.g. | :--- | :---: | ---: |).
 */
function isTableSeparator(line: string): boolean {
  const cells = parseTableRow(line);
  if (cells.length < 2) return false;
  return cells.every((cell) => /^:?-{2,}:?$/.test(cell));
}

/**
 * Extracts column alignment ('left' | 'center' | 'right') from a table separator row.
 */
function parseAlignments(line: string): Array<"left" | "center" | "right"> {
  const cells = parseTableRow(line);
  return cells.map((cell) => {
    const start = cell.startsWith(":");
    const end = cell.endsWith(":");
    if (start && end) return "center";
    if (end) return "right";
    return "left";
  });
}

function getAlignmentClass(align?: "left" | "center" | "right"): string {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

/**
 * Dependency-free React Markdown renderer designed for Copilot responses.
 * Preserves headings, bold text, numbered lists, bullet lists, code blocks,
 * blockquotes, horizontal rules, tables, and paragraphs.
 */
export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
  let currentTable: {
    headers: string[];
    alignments: Array<"left" | "center" | "right">;
    rows: string[][];
  } | null = null;

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

  const flushTable = () => {
    if (!currentTable) return;
    const { headers, alignments, rows } = currentTable;
    elements.push(
      <div
        key={`table-${elements.length}`}
        className="my-3 overflow-x-auto rounded-lg border border-white/[0.08] bg-[#0A0D15] max-w-full"
      >
        <table className="w-full text-xs border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.04]">
              {headers.map((h, colIdx) => (
                <th
                  key={colIdx}
                  className={`px-3.5 py-2 font-semibold text-zinc-200 font-mono text-[11px] whitespace-nowrap ${getAlignmentClass(
                    alignments[colIdx]
                  )}`}
                >
                  {renderInline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="hover:bg-white/[0.02] transition-colors"
              >
                {row.map((cell, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-3.5 py-2 text-zinc-300 text-xs ${getAlignmentClass(
                      alignments[colIdx]
                    )}`}
                  >
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    currentTable = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block delimiter
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        flushList();
        flushTable();
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
        flushTable();
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
      flushTable();
      continue;
    }

    // Horizontal rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      flushList();
      flushTable();
      elements.push(<hr key={`hr-${elements.length}`} className="border-white/[0.08] my-3" />);
      continue;
    }

    // Check if current line starts a new table (header followed by separator)
    if (!currentTable && trimmed.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flushList();
      const headers = parseTableRow(trimmed);
      const alignments = parseAlignments(lines[i + 1]);
      currentTable = { headers, alignments, rows: [] };
      i++; // Skip separator line
      continue;
    }

    // If currently inside a table
    if (currentTable) {
      if (trimmed.includes("|")) {
        const cells = parseTableRow(trimmed);
        if (cells.length > 0) {
          currentTable.rows.push(cells);
          continue;
        }
      }
      // Line is not a table row -> flush table and continue parsing this line
      flushTable();
    }

    // Headings
    if (trimmed.startsWith("#### ")) {
      flushList();
      flushTable();
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
      flushTable();
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
      flushTable();
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
      flushTable();
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
      flushTable();
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
      flushTable();
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
      flushTable();
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    // Regular paragraph
    flushList();
    flushTable();
    elements.push(
      <p key={`p-${elements.length}`} className="text-xs text-zinc-200 leading-relaxed my-1.5">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();
  flushTable();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
