import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, ModelMessage } from "ai";
import { createMerchantTools, ToolCallLog } from "./tools";
import { MERCHANT_AGENT_SYSTEM_PROMPT } from "./prompts";
import type { AgentActionRecord } from "../db/queries";

export const GEMINI_AGENT_MODEL = "gemini-flash-lite-latest";
export const GEMINI_FALLBACK_MODEL = "gemini-flash-latest";

export interface AgentExecutionStep {
  step: string;
  detail: string;
  time: string;
  completed: boolean;
  error?: boolean;
}

export interface AgentResponse {
  answer: string;
  sources: Array<{
    title: string;
    source: string;
  }>;
  executionTrace: AgentExecutionStep[];
  toolsUsed: string[];
  actionProposal: AgentActionRecord | null;
}

function getGoogleProvider() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in server environment variables.");
  }
  return createGoogleGenerativeAI({ apiKey });
}

export function getGeminiModel(modelName: string = GEMINI_AGENT_MODEL) {
  const google = getGoogleProvider();
  return google(modelName);
}

const toolFriendlyNames: Record<string, string> = {
  get_dashboard_metrics: "Querying dashboard KPIs",
  get_revenue_trend: "Evaluating revenue trend",
  get_payment_health: "Checking payment health rails",
  search_payments: "Filtering payment transactions",
  analyze_failed_payments: "Analyzing failed payments",
  find_repeated_failure_customers: "Auditing repeat customer failures",
  get_refund_analytics: "Auditing refund metrics",
  search_merchant_knowledge: "Searching merchant knowledge base",
  prepare_recovery_plan: "Preparing customer recovery plan proposal",
  prepare_support_case: "Preparing operational support ticket proposal",
  prepare_refund: "Preparing refund proposal",
};

/**
 * Runs the AI Merchant Operations Copilot agent with dynamic tool calling, RAG, and controlled action proposals.
 */
export async function runMerchantAgent(userMessage: string): Promise<AgentResponse> {
  const trace: AgentExecutionStep[] = [];
  const toolsUsedSet = new Set<string>();
  const ragSourcesMap = new Map<string, string>();
  let capturedActionProposal: AgentActionRecord | null = null;

  // Initial step
  trace.push({
    step: "Analyzing merchant request",
    detail: `Query: "${userMessage.slice(0, 60)}${userMessage.length > 60 ? "..." : ""}"`,
    time: "20ms",
    completed: true,
  });

  const toolCallLogs: ToolCallLog[] = [];
  const tools = createMerchantTools(
    (log) => {
      toolCallLogs.push(log);
      toolsUsedSet.add(log.toolName);

      const friendlyName = toolFriendlyNames[log.toolName] || log.toolName;
      trace.push({
        step: friendlyName,
        detail: log.summary,
        time: `${log.durationMs}ms`,
        completed: log.success,
      });
    },
    (action) => {
      capturedActionProposal = action;
      trace.push({
        step: "Action Proposal Generated",
        detail: `Status: PENDING_APPROVAL | ${action.title}`,
        time: "10ms",
        completed: true,
      });
    }
  );

  // Track RAG sources specifically
  const originalSearchKnowledge = tools.search_merchant_knowledge.execute;
  if (originalSearchKnowledge) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    tools.search_merchant_knowledge.execute = async (args: any, options: any) => {
      const results = (await (originalSearchKnowledge as any)(args, options)) as Array<{
        title: string;
        content: string;
        similarity: number;
        source: string;
      }>;
      /* eslint-enable @typescript-eslint/no-explicit-any */
      if (Array.isArray(results)) {
        for (const r of results) {
          if (r.source && !ragSourcesMap.has(r.source)) {
            const cleanTitle = r.title.split(" - ")[0] || r.title;
            ragSourcesMap.set(r.source, cleanTitle);
          }
        }
      }
      return results;
    };
  }

  const messages: ModelMessage[] = [
    { role: "user", content: userMessage.trim() },
  ];

  let finalAnswer = "";
  let modelName = GEMINI_AGENT_MODEL;
  const maxIterations = 4;
  const tTotalStart = Date.now();

  try {
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let res;
      try {
        const model = getGeminiModel(modelName);
        res = await generateText({
          model,
          system: MERCHANT_AGENT_SYSTEM_PROMPT,
          messages,
          tools,
        });
      } catch (callErr: unknown) {
        // Fallback model retry if quota or model error
        console.warn(`[Agent] Model ${modelName} encountered error, trying fallback ${GEMINI_FALLBACK_MODEL}:`, callErr);
        modelName = GEMINI_FALLBACK_MODEL;
        const fallbackModel = getGeminiModel(GEMINI_FALLBACK_MODEL);
        res = await generateText({
          model: fallbackModel,
          system: MERCHANT_AGENT_SYSTEM_PROMPT,
          messages,
          tools,
        });
      }

      // Check if Gemini invoked tools
      if (res.toolCalls && res.toolCalls.length > 0) {
        messages.push(...res.responseMessages);
      } else {
        // Final text generated
        finalAnswer = res.text.trim();
        break;
      }
    }

    if (!finalAnswer) {
      // If loop exited after maxIterations without final text, generate synthesis from messages
      const model = getGeminiModel(modelName);
      const synthesisRes = await generateText({
        model,
        system: MERCHANT_AGENT_SYSTEM_PROMPT,
        messages: [
          ...messages,
          {
            role: "user",
            content: "Synthesize the final operational answer based on all the tool execution evidence above.",
          },
        ],
      });
      finalAnswer = synthesisRes.text.trim();
    }

    const totalDuration = Date.now() - tTotalStart;
    trace.push({
      step: "Synthesizing operational evidence",
      detail: `Generated evidence-backed response (${finalAnswer.length} chars)`,
      time: `${totalDuration}ms`,
      completed: true,
    });

    // If an action proposal was generated, add waiting for approval step to trace
    if (capturedActionProposal) {
      trace.push({
        step: "Waiting for merchant approval",
        detail: "Action requires explicit operator authorization via Action Card",
        time: "0ms",
        completed: false,
      });
    }

    const sources = Array.from(ragSourcesMap.entries()).map(([source, title]) => ({
      title,
      source,
    }));

    return {
      answer: finalAnswer,
      sources,
      executionTrace: trace,
      toolsUsed: Array.from(toolsUsedSet),
      actionProposal: capturedActionProposal,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Agent] Fatal agent execution error:", msg);

    trace.push({
      step: "Agent execution interrupted",
      detail: msg,
      time: `${Date.now() - tTotalStart}ms`,
      completed: false,
      error: true,
    });

    const isRateLimit = msg.toLowerCase().includes("quota") || msg.includes("429");
    const userFriendlyMsg = isRateLimit
      ? "Google Gemini API rate limit reached (free tier quota). Please wait 15-20 seconds and submit your query again."
      : "An error occurred while evaluating your operational query. Please check server logs and configuration.";

    return {
      answer: userFriendlyMsg,
      sources: [],
      executionTrace: trace,
      toolsUsed: Array.from(toolsUsedSet),
      actionProposal: null,
    };
  }
}

export const answerMerchantQuestion = runMerchantAgent;
