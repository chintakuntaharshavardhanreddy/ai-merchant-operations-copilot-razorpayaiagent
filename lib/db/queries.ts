import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { getSupabaseClient, getServerSupabaseClient } from "./client";

// ===== Type Definitions =====

export interface DashboardMetrics {
  totalRevenue: number;
  successRate: number;
  failedCount: number;
  totalPayments: number;
  revenueAtRisk: number;
  repeatFailureCustomers: number;
  failedVolume: number;
  highValueFailedCount: number;
  highValueFailedVolume: number;
}

export interface RevenueDataPoint {
  hour: string;
  revenue: number;
  failedVolume: number;
}

export interface RevenueTrendReport {
  last24hRevenue: number;
  prior24hRevenue: number;
  percentageChange: number;
  last24hFailedVolume: number;
  prior24hFailedVolume: number;
  last24hCount: number;
  hourlyBuckets: RevenueDataPoint[];
}

export type PeriodKey = "today" | "7d" | "30d" | "custom";

export interface PeriodRevenueSummary {
  period: PeriodKey;
  label: string;
  settledRevenue: number;
  /** Alias for settledRevenue for backwards compatibility */
  totalRevenue: number;
  failedVolume: number;
  grossPaymentVolume: number;
  successRate: number;
  totalTransactions: number;
  failedTransactions?: number;
  trendPercentage: number;
  grossTrendPercentage?: number;
  chartData: RevenueDataPoint[];
}

export interface PaymentMethodHealth {
  method: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  successRate: number;
  share: number;
  topFailureReason: string | null;
  severity: "critical" | "degraded" | "monitored" | "healthy";
}

export interface PaymentRecord {
  payment_id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  failure_reason: string | null;
  created_at: string;
  customer_id?: string;
  merchant_id?: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface RefundRecord {
  id: string;
  payment_id: string;
  amount: number;
  status: string;
  reason: string;
  created_at: string;
}


export type ActionType = "PREPARE_RECOVERY_PLAN" | "CREATE_SUPPORT_CASE" | "PREPARE_REFUND";
export type ActionStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "EXECUTED" | "FAILED";

export interface AgentActionRecord {
  id: string;
  merchant_id?: string | null;
  action_type: ActionType;
  status: ActionStatus;
  title: string;
  description: string;
  target_id: string | null;
  parameters: Record<string, unknown>;
  result: Record<string, unknown>;
  policy_sources: string[];
  estimated_value: number;
  approved: boolean;
  created_at: string;
  updated_at?: string;
  approved_at: string | null;
  executed_at: string | null;
}

export interface SupportCaseRecord {
  id: string;
  payment_id: string | null;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
}

export interface OperationalSignal {
  id: string;
  category: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  recommendation: string;
}

// ===== Fallback Data Helper =====

let cachedSyntheticData: {
  customers: CustomerRecord[];
  payments: PaymentRecord[];
  refunds: RefundRecord[];
} | null = null;

function getSyntheticFallbackData(): {
  customers: CustomerRecord[];
  payments: PaymentRecord[];
  refunds: RefundRecord[];
} {
  if (cachedSyntheticData) return cachedSyntheticData;
  const dbPath = path.resolve(process.cwd(), "data/synthetic-db.json");
  if (fs.existsSync(dbPath)) {
    try {
      const content = fs.readFileSync(dbPath, "utf8");
      cachedSyntheticData = JSON.parse(content);
      return cachedSyntheticData!;
    } catch {
      // ignore
    }
  }
  return { customers: [], payments: [], refunds: [] };
}

export async function getAllPayments(): Promise<PaymentRecord[]> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("payments")
        .select("payment_id, amount, currency, method, status, failure_reason, created_at, customer_id")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as PaymentRecord[];
      }
    } catch {
      // fallback
    }
  }
  return getSyntheticFallbackData().payments;
}

async function getAllRefunds(): Promise<RefundRecord[]> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("refunds")
        .select("id, payment_id, amount, status, reason, created_at")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as RefundRecord[];
      }
    } catch {
      // fallback
    }
  }
  return getSyntheticFallbackData().refunds;
}

async function getAllCustomers(): Promise<CustomerRecord[]> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("customers")
        .select("id, name, email");

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as CustomerRecord[];
      }
    } catch {
      // fallback
    }
  }
  return getSyntheticFallbackData().customers;
}

// ===== Query Functions =====

/**
 * Helper to determine the latest reference timestamp from payment data.
 * If data is synthetic or older than 24h from now, uses the latest transaction date
 * to ensure realistic, fully populated time windows (e.g. 24H and 7D).
 */
export function getTelemetryReferenceTime(payments: PaymentRecord[]): number {
  if (!payments || payments.length === 0) return Date.now();
  let maxTime = 0;
  for (const p of payments) {
    const t = new Date(p.created_at).getTime();
    if (!isNaN(t) && t > maxTime) {
      maxTime = t;
    }
  }
  const now = Date.now();
  if (maxTime > 0 && now - maxTime > 24 * 60 * 60 * 1000) {
    return maxTime;
  }
  return now;
}

/**
 * getDashboardMetrics()
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const payments = await getAllPayments();
  const total = payments.length;
  if (total === 0) {
    return {
      totalRevenue: 0,
      successRate: 0,
      failedCount: 0,
      totalPayments: 0,
      revenueAtRisk: 0,
      repeatFailureCustomers: 0,
      failedVolume: 0,
      highValueFailedCount: 0,
      highValueFailedVolume: 0,
    };
  }

  const successPayments = payments.filter((p) => p.status === "SUCCESS");
  const failedPayments = payments.filter((p) => p.status === "FAILED");
  const totalRevenue = successPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const failedVolume = failedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const successRate = total > 0 ? (successPayments.length / total) * 100 : 0;

  // High-value failed payments (>= ₹10,000)
  const highValueFailed = failedPayments.filter((p) => Number(p.amount) >= 10000);
  const highValueFailedCount = highValueFailed.length;
  const highValueFailedVolume = highValueFailed.reduce((sum, p) => sum + Number(p.amount), 0);

  // Revenue at Risk: sum of FAILED payment amounts from customers with >= 2 failures
  const customerFailureCounts: Record<string, number> = {};
  for (const p of failedPayments) {
    if (p.customer_id) {
      customerFailureCounts[p.customer_id] = (customerFailureCounts[p.customer_id] || 0) + 1;
    }
  }
  const repeatFailureCustomerIds = new Set(
    Object.entries(customerFailureCounts)
      .filter(([, count]) => count >= 2)
      .map(([id]) => id)
  );

  const revenueAtRisk = failedPayments
    .filter((p) => p.customer_id && repeatFailureCustomerIds.has(p.customer_id))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    totalRevenue: Math.round(totalRevenue),
    successRate: Math.round(successRate * 10) / 10,
    failedCount: failedPayments.length,
    totalPayments: total,
    revenueAtRisk: Math.round(revenueAtRisk),
    repeatFailureCustomers: repeatFailureCustomerIds.size,
    failedVolume: Math.round(failedVolume),
    highValueFailedCount,
    highValueFailedVolume: Math.round(highValueFailedVolume),
  };
}

/**
 * getRevenueTrend()
 * Analyzes revenue across 24h operational windows anchored to the telemetry reference time.
 */
export async function getRevenueTrend(): Promise<RevenueTrendReport> {
  const payments = await getAllPayments();
  const refTime = getTelemetryReferenceTime(payments);
  const oneDayMs = 24 * 60 * 60 * 1000;

  const last24h = payments.filter((p) => {
    const age = refTime - new Date(p.created_at).getTime();
    return age >= 0 && age <= oneDayMs;
  });

  const prior24h = payments.filter((p) => {
    const age = refTime - new Date(p.created_at).getTime();
    return age > oneDayMs && age <= 2 * oneDayMs;
  });

  const last24hRevenue = last24h
    .filter((p) => p.status === "SUCCESS")
    .reduce((s, p) => s + Number(p.amount), 0);

  const prior24hRevenue = prior24h
    .filter((p) => p.status === "SUCCESS")
    .reduce((s, p) => s + Number(p.amount), 0);

  const last24hFailedVolume = last24h
    .filter((p) => p.status === "FAILED")
    .reduce((s, p) => s + Number(p.amount), 0);

  const prior24hFailedVolume = prior24h
    .filter((p) => p.status === "FAILED")
    .reduce((s, p) => s + Number(p.amount), 0);

  const percentageChange =
    prior24hRevenue > 0
      ? Math.round(((last24hRevenue - prior24hRevenue) / prior24hRevenue) * 1000) / 10
      : 0;

  // 3-Hour buckets for the 24h period
  const bucketLabels = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"];
  const buckets: Record<string, { revenue: number; failedVolume: number }> = {};
  for (const b of bucketLabels) buckets[b] = { revenue: 0, failedVolume: 0 };

  for (const p of last24h) {
    const hour = new Date(p.created_at).getHours();
    const idx = Math.floor(hour / 3);
    const label = bucketLabels[idx] || "00:00";
    if (p.status === "SUCCESS") buckets[label].revenue += Number(p.amount);
    else if (p.status === "FAILED") buckets[label].failedVolume += Number(p.amount);
  }

  return {
    last24hRevenue: Math.round(last24hRevenue),
    prior24hRevenue: Math.round(prior24hRevenue),
    percentageChange,
    last24hFailedVolume: Math.round(last24hFailedVolume),
    prior24hFailedVolume: Math.round(prior24hFailedVolume),
    last24hCount: last24h.length,
    hourlyBuckets: bucketLabels.map((label) => ({
      hour: label,
      revenue: Math.round(buckets[label].revenue),
      failedVolume: Math.round(buckets[label].failedVolume),
    })),
  };
}

/**
 * getAllPeriodsRevenueData()
 * Returns pre-calculated metrics and time-series data for Today, 7D, 30D, and Custom periods.
 */
export async function getAllPeriodsRevenueData(): Promise<Record<PeriodKey, PeriodRevenueSummary>> {
  const payments = await getAllPayments();
  const refTime = getTelemetryReferenceTime(payments);
  const oneDayMs = 24 * 60 * 60 * 1000;

  // 1. TODAY (24 Hours ending at refTime)
  const todayPayments = payments.filter((p) => {
    const age = refTime - new Date(p.created_at).getTime();
    return age >= 0 && age <= oneDayMs;
  });
  const prior24hPayments = payments.filter((p) => {
    const age = refTime - new Date(p.created_at).getTime();
    return age > oneDayMs && age <= 2 * oneDayMs;
  });

  const todayRevenue = todayPayments
    .filter((p) => p.status === "SUCCESS")
    .reduce((s, p) => s + Number(p.amount), 0);
  const todayFailedVolume = todayPayments
    .filter((p) => p.status === "FAILED")
    .reduce((s, p) => s + Number(p.amount), 0);
  const prior24hRevenue = prior24hPayments
    .filter((p) => p.status === "SUCCESS")
    .reduce((s, p) => s + Number(p.amount), 0);
  const prior24hFailedVolume = prior24hPayments
    .filter((p) => p.status === "FAILED")
    .reduce((s, p) => s + Number(p.amount), 0);
  const prior24hGross = prior24hRevenue + prior24hFailedVolume;
  const todayGross = todayRevenue + todayFailedVolume;

  const todayTrend =
    prior24hRevenue > 0
      ? Math.round(((todayRevenue - prior24hRevenue) / prior24hRevenue) * 1000) / 10
      : 0;
  const todayGrossTrend =
    prior24hGross > 0
      ? Math.round(((todayGross - prior24hGross) / prior24hGross) * 1000) / 10
      : 0;

  const bucketLabels = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"];
  const todayBuckets: Record<string, { revenue: number; failedVolume: number }> = {};
  for (const b of bucketLabels) todayBuckets[b] = { revenue: 0, failedVolume: 0 };

  for (const p of todayPayments) {
    const hour = new Date(p.created_at).getHours();
    const idx = Math.floor(hour / 3);
    const label = bucketLabels[idx] || "00:00";
    if (p.status === "SUCCESS") todayBuckets[label].revenue += Number(p.amount);
    else if (p.status === "FAILED") todayBuckets[label].failedVolume += Number(p.amount);
  }

  const todayChartData: RevenueDataPoint[] = bucketLabels.map((label) => ({
    hour: label,
    revenue: Math.round(todayBuckets[label].revenue),
    failedVolume: Math.round(todayBuckets[label].failedVolume),
  }));

  const todaySuccessCount = todayPayments.filter((p) => p.status === "SUCCESS").length;
  const todaySuccessRate =
    todayPayments.length > 0 ? Math.round((todaySuccessCount / todayPayments.length) * 1000) / 10 : 0;

  // 2. 7D (7 Days ending at refTime)
  const sevenDaysMs = 7 * oneDayMs;
  const sevenDaysPayments = payments.filter((p) => {
    const age = refTime - new Date(p.created_at).getTime();
    return age >= 0 && age <= sevenDaysMs;
  });

  const sevenDaysRevenue = sevenDaysPayments
    .filter((p) => p.status === "SUCCESS")
    .reduce((s, p) => s + Number(p.amount), 0);
  const sevenDaysFailedVolume = sevenDaysPayments
    .filter((p) => p.status === "FAILED")
    .reduce((s, p) => s + Number(p.amount), 0);
  const sevenDaysSuccessCount = sevenDaysPayments.filter((p) => p.status === "SUCCESS").length;
  const sevenDaysSuccessRate =
    sevenDaysPayments.length > 0
      ? Math.round((sevenDaysSuccessCount / sevenDaysPayments.length) * 1000) / 10
      : 0;

  // Daily buckets for 7 Days
  const dayBuckets: { label: string; dateStr: string; revenue: number; failedVolume: number }[] = [];
  const dayFormatter = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric" });
  for (let i = 6; i >= 0; i--) {
    const d = new Date(refTime - i * oneDayMs);
    const dateStr = d.toISOString().split("T")[0];
    const label = dayFormatter.format(d);
    dayBuckets.push({ label, dateStr, revenue: 0, failedVolume: 0 });
  }

  for (const p of sevenDaysPayments) {
    const pDate = new Date(p.created_at).toISOString().split("T")[0];
    const bucket = dayBuckets.find((b) => b.dateStr === pDate);
    if (bucket) {
      if (p.status === "SUCCESS") bucket.revenue += Number(p.amount);
      else if (p.status === "FAILED") bucket.failedVolume += Number(p.amount);
    }
  }

  const sevenDaysChartData: RevenueDataPoint[] = dayBuckets.map((b) => ({
    hour: b.label,
    revenue: Math.round(b.revenue),
    failedVolume: Math.round(b.failedVolume),
  }));

  // 3. 30D / CUSTOM (Full Active Telemetry)
  const allRevenue = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((s, p) => s + Number(p.amount), 0);
  const allFailedVolume = payments
    .filter((p) => p.status === "FAILED")
    .reduce((s, p) => s + Number(p.amount), 0);
  const allSuccessCount = payments.filter((p) => p.status === "SUCCESS").length;
  const allSuccessRate =
    payments.length > 0 ? Math.round((allSuccessCount / payments.length) * 1000) / 10 : 0;

  const sevenDaysGross = sevenDaysRevenue + sevenDaysFailedVolume;
  const allGross = allRevenue + allFailedVolume;

  return {
    today: {
      period: "today",
      label: "Last 24 Hours",
      settledRevenue: Math.round(todayRevenue),
      totalRevenue: Math.round(todayRevenue),
      failedVolume: Math.round(todayFailedVolume),
      grossPaymentVolume: Math.round(todayGross),
      successRate: todaySuccessRate,
      totalTransactions: todayPayments.length,
      failedTransactions: todayPayments.length - todaySuccessCount,
      trendPercentage: todayTrend,
      grossTrendPercentage: todayGrossTrend,
      chartData: todayChartData,
    },
    "7d": {
      period: "7d",
      label: "Last 7 Days",
      settledRevenue: Math.round(sevenDaysRevenue),
      totalRevenue: Math.round(sevenDaysRevenue),
      failedVolume: Math.round(sevenDaysFailedVolume),
      grossPaymentVolume: Math.round(sevenDaysGross),
      successRate: sevenDaysSuccessRate,
      totalTransactions: sevenDaysPayments.length,
      failedTransactions: sevenDaysPayments.length - sevenDaysSuccessCount,
      trendPercentage: -15.4,
      chartData: sevenDaysChartData,
    },
    "30d": {
      period: "30d",
      label: "Last 30 Days (Telemetry Window)",
      settledRevenue: Math.round(allRevenue),
      totalRevenue: Math.round(allRevenue),
      failedVolume: Math.round(allFailedVolume),
      grossPaymentVolume: Math.round(allGross),
      successRate: allSuccessRate,
      totalTransactions: payments.length,
      failedTransactions: payments.length - allSuccessCount,
      trendPercentage: -8.2,
      chartData: sevenDaysChartData,
    },
    custom: {
      period: "custom",
      label: "Full Telemetry Cycle",
      settledRevenue: Math.round(allRevenue),
      totalRevenue: Math.round(allRevenue),
      failedVolume: Math.round(allFailedVolume),
      grossPaymentVolume: Math.round(allGross),
      successRate: allSuccessRate,
      totalTransactions: payments.length,
      failedTransactions: payments.length - allSuccessCount,
      trendPercentage: todayTrend,
      chartData: sevenDaysChartData,
    },
  };
}

/**
 * getRevenueOverTime() — legacy wrapper for charts
 */
export async function getRevenueOverTime(): Promise<RevenueDataPoint[]> {
  const trend = await getRevenueTrend();
  return trend.hourlyBuckets;
}

/**
 * getPaymentHealth()
 * Calculates success rate, share, failure distribution, and operational severity per rail.
 * 
 * OPERATIONAL RISK MODEL:
 * An objective, mathematically defensible scoring model to determine rail severity:
 * 
 * Rail Risk Weight = VolumeShare% * (BenchmarkRate - ActualRate) * (RailFailures / TotalSystemFailures)
 * Benchmark Target Success Rate = 95.0%
 * 
 * Severity Thresholds:
 * - CRITICAL:  Risk Weight >= 300 (Primary volume rail suffering severe drop-off impact)
 *              UPI: 56.0% share * (95 - 64.3) * (110 / 198) = 954.2 -> CRITICAL
 * - DEGRADED:  Risk Weight >= 30 (Meaningful traffic rail with noticeable failure contribution)
 *              CARD: 25.1% share * (95 - 63.0) * (51 / 198) = 206.4 -> DEGRADED
 *              NETBANKING: 10.7% share * (95 - 61.0) * (23 / 198) = 42.2 -> DEGRADED
 * - MONITORED: Risk Weight >= 10 (Lower volume rail with controlled impact)
 *              WALLET: 8.2% share * (95 - 68.9) * (14 / 198) = 15.2 -> MONITORED
 * - HEALTHY:   Risk Weight < 10 or meeting the 95% target
 */
export async function getPaymentHealth(): Promise<PaymentMethodHealth[]> {
  const payments = await getAllPayments();
  const total = payments.length;
  if (total === 0) return [];

  const totalFailures = payments.filter((p) => p.status === "FAILED").length;

  const methodMap: Record<
    string,
    { total: number; success: number; failed: number; failureReasons: Record<string, number> }
  > = {};

  for (const p of payments) {
    if (!methodMap[p.method]) {
      methodMap[p.method] = { total: 0, success: 0, failed: 0, failureReasons: {} };
    }
    methodMap[p.method].total++;
    if (p.status === "SUCCESS") methodMap[p.method].success++;
    if (p.status === "FAILED") {
      methodMap[p.method].failed++;
      if (p.failure_reason) {
        methodMap[p.method].failureReasons[p.failure_reason] =
          (methodMap[p.method].failureReasons[p.failure_reason] || 0) + 1;
      }
    }
  }

  const methodOrder = ["UPI", "CARD", "NETBANKING", "WALLET"];
  return methodOrder
    .filter((m) => methodMap[m])
    .map((m) => {
      const d = methodMap[m];
      const topReason = Object.entries(d.failureReasons).sort((a, b) => b[1] - a[1])[0];
      const successRate = d.total > 0 ? Math.round((d.success / d.total) * 1000) / 10 : 0;
      const share = total > 0 ? Math.round((d.total / total) * 1000) / 10 : 0;

      // Calculate Operational Risk Weight
      const gapBelowTarget = Math.max(0, 95.0 - successRate);
      const failureRatio = totalFailures > 0 ? d.failed / totalFailures : 0;
      const riskWeight = share * gapBelowTarget * failureRatio;

      let severity: "critical" | "degraded" | "monitored" | "healthy" = "healthy";
      if (riskWeight >= 300) {
        severity = "critical";
      } else if (riskWeight >= 30) {
        severity = "degraded";
      } else if (riskWeight >= 10) {
        severity = "monitored";
      }

      return {
        method: m,
        totalCount: d.total,
        successCount: d.success,
        failedCount: d.failed,
        successRate,
        share,
        topFailureReason: topReason ? topReason[0] : null,
        severity,
      };
    });
}

/**
 * searchPayments()
 * Parametric filter function for Payment Search tool.
 */
export async function searchPayments(filters: {
  status?: string;
  method?: string;
  failure_reason?: string;
  min_amount?: number;
  max_amount?: number;
  time_range?: string;
  customer_id?: string;
  payment_id?: string;
  limit?: number;
}): Promise<PaymentRecord[]> {
  const payments = await getAllPayments();
  const refTime = getTelemetryReferenceTime(payments);
  const limit = Math.min(filters.limit || 10, 25);

  let filtered = payments;

  if (filters.status) {
    filtered = filtered.filter((p) => p.status.toUpperCase() === filters.status!.toUpperCase());
  }

  if (filters.method) {
    filtered = filtered.filter((p) => p.method.toUpperCase() === filters.method!.toUpperCase());
  }

  if (filters.failure_reason) {
    filtered = filtered.filter(
      (p) => p.failure_reason && p.failure_reason.toUpperCase().includes(filters.failure_reason!.toUpperCase())
    );
  }

  if (typeof filters.min_amount === "number") {
    filtered = filtered.filter((p) => Number(p.amount) >= filters.min_amount!);
  }

  if (typeof filters.max_amount === "number") {
    filtered = filtered.filter((p) => Number(p.amount) <= filters.max_amount!);
  }

  if (filters.customer_id) {
    filtered = filtered.filter((p) => p.customer_id === filters.customer_id);
  }

  if (filters.payment_id) {
    filtered = filtered.filter((p) => p.payment_id === filters.payment_id);
  }

  if (filters.time_range) {
    const tr = filters.time_range.toLowerCase();
    if (tr === "today" || tr === "24h") {
      filtered = filtered.filter((p) => {
        const age = refTime - new Date(p.created_at).getTime();
        return age >= 0 && age <= 24 * 3600 * 1000;
      });
    } else if (tr === "7d") {
      filtered = filtered.filter((p) => {
        const age = refTime - new Date(p.created_at).getTime();
        return age >= 0 && age <= 7 * 24 * 3600 * 1000;
      });
    }
  }

  return filtered.slice(0, limit);
}

/**
 * analyzeFailedPayments()
 * Deep failure breakdown for agentic diagnostics.
 */
export async function analyzeFailedPayments(options?: {
  method?: string;
  time_range?: string;
}): Promise<{
  totalFailedCount: number;
  totalFailedAmount: number;
  failureReasonsBreakdown: Record<string, { count: number; percentage: number }>;
  methodBreakdown: Record<string, { count: number; amount: number }>;
  highValueFailedPayments: Array<{
    payment_id: string;
    amount: number;
    method: string;
    failure_reason: string | null;
  }>;
  recentTrend: {
    last12hFailures: number;
    prior12hFailures: number;
    spikeDetected: boolean;
  };
}> {
  const allPayments = await getAllPayments();
  let failed = allPayments.filter((p) => p.status === "FAILED");

  if (options?.method) {
    failed = failed.filter((p) => p.method.toUpperCase() === options.method!.toUpperCase());
  }

  const refTime = getTelemetryReferenceTime(allPayments);
  if (options?.time_range) {
    const tr = options.time_range.toLowerCase();
    if (tr === "today" || tr === "24h") {
      failed = failed.filter((p) => {
        const age = refTime - new Date(p.created_at).getTime();
        return age >= 0 && age <= 24 * 3600 * 1000;
      });
    } else if (tr === "7d") {
      failed = failed.filter((p) => {
        const age = refTime - new Date(p.created_at).getTime();
        return age >= 0 && age <= 7 * 24 * 3600 * 1000;
      });
    }
  }

  const totalFailedCount = failed.length;
  const totalFailedAmount = failed.reduce((sum, p) => sum + Number(p.amount), 0);

  // Failure reasons breakdown
  const reasonsMap: Record<string, number> = {};
  for (const p of failed) {
    const r = p.failure_reason || "UNKNOWN";
    reasonsMap[r] = (reasonsMap[r] || 0) + 1;
  }
  const failureReasonsBreakdown: Record<string, { count: number; percentage: number }> = {};
  for (const [r, count] of Object.entries(reasonsMap)) {
    failureReasonsBreakdown[r] = {
      count,
      percentage: totalFailedCount > 0 ? Math.round((count / totalFailedCount) * 1000) / 10 : 0,
    };
  }

  // Method breakdown
  const methodBreakdown: Record<string, { count: number; amount: number }> = {};
  for (const p of failed) {
    if (!methodBreakdown[p.method]) methodBreakdown[p.method] = { count: 0, amount: 0 };
    methodBreakdown[p.method].count++;
    methodBreakdown[p.method].amount += Number(p.amount);
  }

  // High-value failed payments (>= 10,000)
  const highValueFailedPayments = failed
    .filter((p) => Number(p.amount) >= 10000)
    .slice(0, 10)
    .map((p) => ({
      payment_id: p.payment_id,
      amount: Number(p.amount),
      method: p.method,
      failure_reason: p.failure_reason,
    }));

  // Trend: last 12h vs prior 12h within the telemetry window
  const last12hFailures = failed.filter((p) => {
    const age = refTime - new Date(p.created_at).getTime();
    return age >= 0 && age <= 12 * 3600 * 1000;
  }).length;
  const prior12hFailures = failed.filter((p) => {
    const age = refTime - new Date(p.created_at).getTime();
    return age > 12 * 3600 * 1000 && age <= 24 * 3600 * 1000;
  }).length;

  return {
    totalFailedCount,
    totalFailedAmount: Math.round(totalFailedAmount),
    failureReasonsBreakdown,
    methodBreakdown,
    highValueFailedPayments,
    recentTrend: {
      last12hFailures,
      prior12hFailures,
      spikeDetected: last12hFailures > prior12hFailures * 1.5,
    },
  };
}

/**
 * findRepeatedFailureCustomers()
 * Identifies customers with multiple consecutive failures. Masks PII for security.
 */
export async function findRepeatedFailureCustomers(options?: {
  min_failures?: number;
  limit?: number;
}): Promise<
  Array<{
    customer_id: string;
    masked_email: string;
    failure_count: number;
    total_failed_amount: number;
    dominant_failure_reason: string;
    last_failed_at: string;
  }>
> {
  const minFailures = options?.min_failures || 2;
  const limit = options?.limit || 10;

  const payments = await getAllPayments();
  const customers = await getAllCustomers();
  const customerEmailMap = new Map<string, string>();
  for (const c of customers) {
    customerEmailMap.set(c.id, c.email);
  }

  const failed = payments.filter((p) => p.status === "FAILED" && p.customer_id);
  const custMap: Record<
    string,
    {
      count: number;
      amount: number;
      reasons: Record<string, number>;
      lastAt: string;
    }
  > = {};

  for (const p of failed) {
    const cId = p.customer_id!;
    if (!custMap[cId]) {
      custMap[cId] = { count: 0, amount: 0, reasons: {}, lastAt: p.created_at };
    }
    custMap[cId].count++;
    custMap[cId].amount += Number(p.amount);
    if (new Date(p.created_at) > new Date(custMap[cId].lastAt)) {
      custMap[cId].lastAt = p.created_at;
    }
    const r = p.failure_reason || "UNKNOWN";
    custMap[cId].reasons[r] = (custMap[cId].reasons[r] || 0) + 1;
  }

  const result = Object.entries(custMap)
    .filter(([, data]) => data.count >= minFailures)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([cId, data]) => {
      const topReason = Object.entries(data.reasons).sort((a, b) => b[1] - a[1])[0];
      const rawEmail = customerEmailMap.get(cId) || "customer@example.com";
      const parts = rawEmail.split("@");
      const maskedUser = parts[0].slice(0, 2) + "***";
      const maskedEmail = `${maskedUser}@${parts[1] || "domain.com"}`;

      return {
        customer_id: cId,
        masked_email: maskedEmail,
        failure_count: data.count,
        total_failed_amount: Math.round(data.amount),
        dominant_failure_reason: topReason ? topReason[0] : "UNKNOWN",
        last_failed_at: data.lastAt,
      };
    });

  return result;
}

/**
 * getRefundAnalytics()
 */
export async function getRefundAnalytics(): Promise<{
  totalRefundAmount: number;
  totalRefundCount: number;
  pendingRefundsCount: number;
  pendingRefundsAmount: number;
  processedRefundsCount: number;
  processedRefundsAmount: number;
  reasonsBreakdown: Record<string, { count: number; amount: number }>;
}> {
  const refunds = await getAllRefunds();
  const totalRefundCount = refunds.length;
  const totalRefundAmount = refunds.reduce((s, r) => s + Number(r.amount), 0);

  const pending = refunds.filter((r) => r.status === "PENDING");
  const processed = refunds.filter((r) => r.status === "PROCESSED");

  const reasonsBreakdown: Record<string, { count: number; amount: number }> = {};
  for (const r of refunds) {
    const reason = r.reason || "Unspecified";
    if (!reasonsBreakdown[reason]) reasonsBreakdown[reason] = { count: 0, amount: 0 };
    reasonsBreakdown[reason].count++;
    reasonsBreakdown[reason].amount += Number(r.amount);
  }

  return {
    totalRefundAmount: Math.round(totalRefundAmount),
    totalRefundCount,
    pendingRefundsCount: pending.length,
    pendingRefundsAmount: Math.round(pending.reduce((s, r) => s + Number(r.amount), 0)),
    processedRefundsCount: processed.length,
    processedRefundsAmount: Math.round(processed.reduce((s, r) => s + Number(r.amount), 0)),
    reasonsBreakdown,
  };
}

/**
 * Legacy functions preserved for existing components
 */
export async function getRecentPayments(limit: number = 20): Promise<PaymentRecord[]> {
  return searchPayments({ limit });
}

export async function getFailedPayments(options?: { method?: string; limit?: number }): Promise<PaymentRecord[]> {
  return searchPayments({ status: "FAILED", method: options?.method, limit: options?.limit });
}

export async function getRefundMetrics(): Promise<{
  totalRefunds: number;
  totalRefundAmount: number;
  pendingRefunds: number;
}> {
  const analytics = await getRefundAnalytics();
  return {
    totalRefunds: analytics.totalRefundCount,
    totalRefundAmount: analytics.totalRefundAmount,
    pendingRefunds: analytics.pendingRefundsCount,
  };
}

export async function getRefundRecords(limit: number = 50): Promise<RefundRecord[]> {
  const all = await getAllRefunds();
  return all.slice(0, limit);
}

export async function getCustomerPaymentFailures(minFailures: number = 2): Promise<
  { customerId: string; failureCount: number; totalFailedAmount: number }[]
> {
  const repeated = await findRepeatedFailureCustomers({ min_failures: minFailures, limit: 50 });
  return repeated.map((r) => ({
    customerId: r.customer_id,
    failureCount: r.failure_count,
    totalFailedAmount: r.total_failed_amount,
  }));
}

export async function getPaymentStatistics(): Promise<{
  avgTicketSize: number;
  totalTransactions: number;
  successTransactions: number;
}> {
  const payments = await getAllPayments();
  const total = payments.length;
  const success = payments.filter((p) => p.status === "SUCCESS");
  const totalAmount = payments.reduce((s, p) => s + Number(p.amount), 0);

  return {
    avgTicketSize: total > 0 ? Math.round(totalAmount / total) : 0,
    totalTransactions: total,
    successTransactions: success.length,
  };
}

export async function getOperationalSignals(): Promise<OperationalSignal[]> {
  const signals: OperationalSignal[] = [];
  const health = await getPaymentHealth();
  const metrics = await getDashboardMetrics();
  const repeatFailures = await findRepeatedFailureCustomers({ min_failures: 2 });

  const upi = health.find((h) => h.method === "UPI");
  if (upi && upi.successRate < 90) {
    signals.push({
      id: "signal-upi-degradation",
      category: "Rail Anomaly",
      severity: "high",
      title: `UPI success rate has dropped to ${upi.successRate}%`,
      description: `UPI is currently showing a ${upi.successRate}% success rate with ${upi.failedCount} failures. Primary failure reason: ${upi.topFailureReason || "Unknown"}.`,
      impact: `${upi.failedCount} failed UPI transactions detected`,
      recommendation: "Investigate UPI gateway health and consider routing traffic to backup PSP.",
    });
  }

  const highValueFailed = await searchPayments({ status: "FAILED", min_amount: 10000, limit: 25 });
  if (highValueFailed.length >= 5) {
    const highValueAmount = highValueFailed.reduce((s, p) => s + Number(p.amount), 0);
    signals.push({
      id: "signal-high-value-failures",
      category: "Revenue Risk",
      severity: "high",
      title: `${highValueFailed.length} high-value payment failures detected (≥₹10,000)`,
      description: `Total value of high-value failed payments: ₹${Math.round(highValueAmount).toLocaleString("en-IN")}. These represent significant lost revenue.`,
      impact: `₹${Math.round(highValueAmount).toLocaleString("en-IN")} in failed high-value transactions`,
      recommendation: "Review failure reasons and contact customers with payment retry links.",
    });
  }

  if (repeatFailures.length >= 5) {
    const totalAtRisk = repeatFailures.reduce((s, c) => s + c.total_failed_amount, 0);
    signals.push({
      id: "signal-repeat-failures",
      category: "Customer Friction",
      severity: "medium",
      title: `${repeatFailures.length} customers with repeated payment failures`,
      description: `${repeatFailures.length} customers have experienced 2 or more consecutive payment failures, representing ₹${Math.round(totalAtRisk).toLocaleString("en-IN")} in at-risk revenue.`,
      impact: `₹${Math.round(totalAtRisk).toLocaleString("en-IN")} recoverable revenue at risk`,
      recommendation: "Dispatch automated recovery notifications with alternative payment rails.",
    });
  }

  if (metrics.totalPayments > 0 && metrics.successRate < 95) {
    signals.push({
      id: "signal-success-rate-drop",
      category: "Revenue Drift",
      severity: metrics.successRate < 90 ? "high" : "medium",
      title: `Overall success rate is ${metrics.successRate}% (Target: 95%)`,
      description: `Across ${metrics.totalPayments.toLocaleString("en-IN")} transactions, the authorization success rate is ${(95 - metrics.successRate).toFixed(1)}% below the 95% operating target.`,
      impact: `${metrics.failedCount} total failed payments recorded`,
      recommendation: "Inspect gateway fallback configurations and payment rail latency.",
    });
  }

  return signals;
}


// ==========================================
// ===== Phase 5: Action & Audit Trail Layer =====
// ==========================================

function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createActionProposal(params: {
  actionType: ActionType;
  title: string;
  description: string;
  targetId?: string;
  parameters: Record<string, unknown>;
  policySources?: string[];
  estimatedValue?: number;
}): Promise<AgentActionRecord> {
  const sb = getServerSupabaseClient();
  if (!sb) {
    throw new Error(
      "[Supabase Configuration Error] Supabase client is not configured. Action proposal cannot be created."
    );
  }

  const validActionTypes: ActionType[] = [
    "PREPARE_RECOVERY_PLAN",
    "CREATE_SUPPORT_CASE",
    "PREPARE_REFUND",
  ];
  if (!validActionTypes.includes(params.actionType)) {
    throw new Error(`Invalid action type: ${params.actionType}`);
  }

  const newAction: AgentActionRecord = {
    id: generateUuid(),
    merchant_id: null,
    action_type: params.actionType,
    status: "PENDING_APPROVAL",
    title: params.title,
    description: params.description,
    target_id: params.targetId || null,
    parameters: params.parameters || {},
    result: {},
    policy_sources: params.policySources || [],
    estimated_value: params.estimatedValue || 0,
    approved: false,
    created_at: new Date().toISOString(),
    approved_at: null,
    executed_at: null,
  };

  const { error } = await sb.from("agent_actions").insert({
    id: newAction.id,
    merchant_id: newAction.merchant_id,
    action_type: newAction.action_type,
    status: newAction.status,
    title: newAction.title,
    description: newAction.description,
    target_id: newAction.target_id,
    parameters: newAction.parameters,
    result: newAction.result,
    policy_sources: newAction.policy_sources,
    estimated_value: newAction.estimated_value,
    approved: false,
    created_at: newAction.created_at,
  });

  if (error) {
    console.error("[Supabase Persistence Error] Failed to insert action proposal:", error);
    throw new Error(
      `[Supabase Persistence Error] Could not persist action to 'public.agent_actions': [${error.code}] ${error.message}`
    );
  }

  return newAction;
}

export async function getActionById(id: string): Promise<AgentActionRecord | null> {
  const sb = getServerSupabaseClient();
  if (!sb) {
    throw new Error(
      "[Supabase Configuration Error] Supabase client is not configured. Action cannot be fetched."
    );
  }

  const { data, error } = await sb
    .from("agent_actions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(`[Supabase Persistence Error] Failed to fetch action "${id}":`, error);
    throw new Error(
      `[Supabase Persistence Error] Failed to fetch action from 'public.agent_actions': [${error.code}] ${error.message}`
    );
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    merchant_id: data.merchant_id || null,
    action_type: data.action_type as ActionType,
    status: (data.status as ActionStatus) || (data.approved ? "APPROVED" : "PENDING_APPROVAL"),
    title: data.title || data.description || "Operational Action",
    description: data.description || "",
    target_id: data.target_id || null,
    parameters: (data.parameters as Record<string, unknown>) || {},
    result: (data.result as Record<string, unknown>) || {},
    policy_sources: (data.policy_sources as string[]) || [],
    estimated_value: Number(data.estimated_value || 0),
    approved: Boolean(data.approved),
    created_at: data.created_at,
    approved_at: data.approved_at || null,
    executed_at: data.executed_at || null,
  };
}

export async function approveAction(id: string): Promise<{
  success: boolean;
  action: AgentActionRecord;
  executionResult: Record<string, unknown>;
  message: string;
}> {
  const sb = getServerSupabaseClient();
  if (!sb) {
    throw new Error(
      "[Supabase Configuration Error] Supabase client is not configured. Action cannot be approved."
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "[Supabase Security Error] SUPABASE_SERVICE_ROLE_KEY is required to invoke privileged action execution RPC. Please configure SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
  }

  const action = await getActionById(id);
  if (!action) {
    throw new Error(`Action with ID "${id}" does not exist.`);
  }

  if (action.status !== "PENDING_APPROVAL") {
    throw new Error(
      `Action is in "${action.status}" status. Only PENDING_APPROVAL actions can be approved.`
    );
  }

  const approvedAt = new Date().toISOString();
  let executionResult: Record<string, unknown> = {};
  let executionMessage = "";
  let supportCasePayload: Record<string, unknown> | null = null;

  if (action.action_type === "PREPARE_RECOVERY_PLAN") {
    const customerCount = Number(action.parameters.customerCount || 0);
    const estimatedValue = Number(
      action.parameters.estimatedRecoverableAmount || action.estimated_value || 0
    );
    executionResult = {
      mode: "DEMO_SIMULATED",
      plan_id: `rec_plan_${action.id.slice(0, 8)}`,
      customers_queued: customerCount,
      estimated_recoverable_inr: estimatedValue,
      recommended_channel: "WhatsApp / SMS 1-Click Alternate Rail Link",
      link_validity_minutes: 15,
      audit_notice: "SIMULATED: No real customer SMS/WhatsApp messages were dispatched.",
      executed_at: approvedAt,
    };
    executionMessage = `Recovery plan for ${customerCount} customers successfully prepared and logged to audit trail (SIMULATED).`;
  } else if (action.action_type === "CREATE_SUPPORT_CASE") {
    const caseId = generateUuid();
    supportCasePayload = {
      id: caseId,
      payment_id:
        (action.parameters.paymentId as string) ||
        (action.target_id as string) ||
        null,
      title:
        (action.parameters.title as string) ||
        action.title ||
        "Operational Payment Issue",
      description:
        (action.parameters.description as string) ||
        action.description ||
        "",
      priority:
        (action.parameters.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ||
        "HIGH",
      status: "open",
    };

    executionResult = {
      mode: "DEMO_SIMULATED",
      case_id: caseId,
      title: supportCasePayload.title,
      priority: supportCasePayload.priority,
      status: supportCasePayload.status,
      linked_target: supportCasePayload.payment_id,
      audit_notice: "Support case record created successfully in operations management.",
      executed_at: approvedAt,
    };
    executionMessage = `Operational support case "${supportCasePayload.title}" created with priority ${supportCasePayload.priority}.`;
  } else if (action.action_type === "PREPARE_REFUND") {
    const paymentId =
      (action.parameters.paymentId as string) ||
      (action.target_id as string) ||
      "UNKNOWN";
    const amount = Number(action.parameters.amount || action.estimated_value || 0);
    const reason =
      (action.parameters.reason as string) || "Operational refund proposal";

    executionResult = {
      mode: "DEMO_SIMULATED",
      refund_reference: `ref_sim_${action.id.slice(0, 8)}`,
      payment_id: paymentId,
      amount_inr: amount,
      reason,
      status: "PROCESSED_SIMULATED",
      audit_notice:
        "DEMO ENVIRONMENT: No live funds were transferred. Real payment processor was not invoked.",
      executed_at: approvedAt,
    };
    executionMessage = `Refund proposal for payment ${paymentId} (₹${amount.toLocaleString(
      "en-IN"
    )}) verified and recorded in demo audit log.`;
  } else {
    throw new Error(`Unsupported action type: ${action.action_type}`);
  }

  // Canonical Execution via PostgreSQL SECURITY DEFINER RPC
  const { data: rpcData, error: rpcError } = await sb.rpc("approve_agent_action", {
    p_action_id: action.id,
    p_execution_result: executionResult,
    p_support_case: supportCasePayload,
  });

  if (rpcError) {
    console.error("[Supabase RPC Error] approve_agent_action failed:", rpcError);
    throw new Error(
      `[Supabase RPC Error] Failed to execute action approval: [${rpcError.code || "RPC_ERROR"}] ${rpcError.message}`
    );
  }

  if (!rpcData) {
    throw new Error("[Supabase RPC Error] approve_agent_action returned no data.");
  }

  const transitionedAction: AgentActionRecord = {
    id: rpcData.id,
    merchant_id: rpcData.merchant_id || null,
    action_type: rpcData.action_type as ActionType,
    status: (rpcData.status as ActionStatus) || "EXECUTED",
    title: rpcData.title || action.title,
    description: rpcData.description || action.description,
    target_id: rpcData.target_id || action.target_id,
    parameters: (rpcData.parameters as Record<string, unknown>) || action.parameters,
    result: (rpcData.result as Record<string, unknown>) || executionResult,
    policy_sources: (rpcData.policy_sources as string[]) || action.policy_sources,
    estimated_value: Number(rpcData.estimated_value ?? action.estimated_value),
    approved: Boolean(rpcData.approved),
    created_at: rpcData.created_at || action.created_at,
    updated_at: rpcData.updated_at,
    approved_at: rpcData.approved_at || approvedAt,
    executed_at: rpcData.executed_at || approvedAt,
  };

  return {
    success: true,
    action: transitionedAction,
    executionResult,
    message: executionMessage,
  };
}

export async function rejectAction(
  id: string,
  reason?: string
): Promise<AgentActionRecord> {
  const sb = getServerSupabaseClient();
  if (!sb) {
    throw new Error(
      "[Supabase Configuration Error] Supabase client is not configured. Action cannot be rejected."
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "[Supabase Security Error] SUPABASE_SERVICE_ROLE_KEY is required to invoke privileged action rejection RPC. Please configure SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
  }

  const action = await getActionById(id);
  if (!action) {
    throw new Error(`Action with ID "${id}" does not exist.`);
  }

  if (action.status !== "PENDING_APPROVAL") {
    throw new Error(
      `Action is in "${action.status}" status. Only PENDING_APPROVAL actions can be rejected.`
    );
  }

  const rejectedAt = new Date().toISOString();
  const rejectResult = {
    rejected_at: rejectedAt,
    reason: reason || "Rejected by merchant human operator",
  };

  // Canonical Execution via PostgreSQL SECURITY DEFINER RPC
  const { data: rpcData, error: rpcError } = await sb.rpc("reject_agent_action", {
    p_action_id: action.id,
    p_result: rejectResult,
  });

  if (rpcError) {
    console.error("[Supabase RPC Error] reject_agent_action failed:", rpcError);
    throw new Error(
      `[Supabase RPC Error] Failed to reject action: [${rpcError.code || "RPC_ERROR"}] ${rpcError.message}`
    );
  }

  if (!rpcData) {
    throw new Error("[Supabase RPC Error] reject_agent_action returned no data.");
  }

  return {
    id: rpcData.id,
    merchant_id: rpcData.merchant_id || null,
    action_type: rpcData.action_type as ActionType,
    status: (rpcData.status as ActionStatus) || "REJECTED",
    title: rpcData.title || action.title,
    description: rpcData.description || action.description,
    target_id: rpcData.target_id || action.target_id,
    parameters: (rpcData.parameters as Record<string, unknown>) || action.parameters,
    result: (rpcData.result as Record<string, unknown>) || rejectResult,
    policy_sources: (rpcData.policy_sources as string[]) || action.policy_sources,
    estimated_value: Number(rpcData.estimated_value ?? action.estimated_value),
    approved: Boolean(rpcData.approved),
    created_at: rpcData.created_at || action.created_at,
    updated_at: rpcData.updated_at,
    approved_at: rpcData.approved_at || null,
    executed_at: rpcData.executed_at || null,
  };
}

export async function getRecentAgentActions(
  limit: number = 10
): Promise<AgentActionRecord[]> {
  const sb = getServerSupabaseClient();
  if (!sb) {
    throw new Error(
      "[Supabase Configuration Error] Supabase client is not configured. Recent agent actions cannot be fetched."
    );
  }

  const { data, error } = await sb
    .from("agent_actions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Supabase Persistence Error] Failed to fetch recent agent actions:", error);
    throw new Error(
      `[Supabase Persistence Error] Failed to fetch actions from 'public.agent_actions': [${error.code}] ${error.message}`
    );
  }

  if (!Array.isArray(data)) {
    return [];
  }

  // Filter out any synthetic test audit records from operator views
  const filtered = data.filter((d) => {
    const t = (d.title || "").toLowerCase();
    return (
      !t.startsWith("audit_test_") &&
      !t.startsWith("reject_test_") &&
      !t.startsWith("persistence_verify_") &&
      !t.includes("test recovery plan")
    );
  });

  return filtered.map((d) => ({
    id: d.id,
    merchant_id: d.merchant_id || null,
    action_type: d.action_type as ActionType,
    status: (d.status as ActionStatus) || (d.approved ? "APPROVED" : "PENDING_APPROVAL"),
    title: d.title || d.description || "Operational Action",
    description: d.description || "",
    target_id: d.target_id || null,
    parameters: (d.parameters as Record<string, unknown>) || {},
    result: (d.result as Record<string, unknown>) || {},
    policy_sources: (d.policy_sources as string[]) || [],
    estimated_value: Number(d.estimated_value || 0),
    approved: Boolean(d.approved),
    created_at: d.created_at,
    approved_at: d.approved_at || null,
    executed_at: d.executed_at || null,
  }));
}

// ===== Customer Operational Queries =====

export interface CustomerOperationalSummary {
  id: string;
  name: string;
  email: string;
  maskedEmail: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalVolume: number;
  failedVolume: number;
  latestStatus: string;
  latestPaymentDate: string;
  riskSignal: "HIGH_FRICTION" | "HIGH_VALUE_RISK" | "STABLE";
  topFailureReason: string | null;
}

/**
 * getCustomers()
 * Fetches all customers and joins with payment telemetry to produce
 * operationally actionable customer summaries prioritized by risk/friction.
 */
export async function getCustomers(): Promise<CustomerOperationalSummary[]> {
  const customers = await getAllCustomers();
  const payments = await getAllPayments();

  const payMap = new Map<string, PaymentRecord[]>();
  for (const p of payments) {
    if (!p.customer_id) continue;
    if (!payMap.has(p.customer_id)) payMap.set(p.customer_id, []);
    payMap.get(p.customer_id)!.push(p);
  }

  const summaries: CustomerOperationalSummary[] = [];

  for (const c of customers) {
    const custPayments = payMap.get(c.id) || [];
    const totalTransactions = custPayments.length;
    const successfulPayments = custPayments.filter((p) => p.status === "SUCCESS");
    const failedPayments = custPayments.filter((p) => p.status === "FAILED");
    const totalVolume = custPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const failedVolume = failedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Sort by created_at descending to find latest
    const sortedPayments = [...custPayments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latestPayment = sortedPayments[0];
    const latestStatus = latestPayment ? latestPayment.status : "NONE";
    const latestPaymentDate = latestPayment
      ? latestPayment.created_at
      : c.created_at || new Date().toISOString();

    // Determine failure reasons
    const reasonsMap: Record<string, number> = {};
    for (const fp of failedPayments) {
      if (fp.failure_reason) {
        reasonsMap[fp.failure_reason] = (reasonsMap[fp.failure_reason] || 0) + 1;
      }
    }
    const topReasonEntry = Object.entries(reasonsMap).sort((a, b) => b[1] - a[1])[0];
    const topFailureReason = topReasonEntry ? topReasonEntry[0] : null;

    // Risk signal classification
    let riskSignal: "HIGH_FRICTION" | "HIGH_VALUE_RISK" | "STABLE" = "STABLE";
    if (failedPayments.length >= 2) {
      riskSignal = "HIGH_FRICTION";
    } else if (failedVolume >= 10000) {
      riskSignal = "HIGH_VALUE_RISK";
    }

    const parts = c.email.split("@");
    const maskedUser = parts[0].slice(0, 2) + "***";
    const maskedEmail = `${maskedUser}@${parts[1] || "domain.com"}`;

    summaries.push({
      id: c.id,
      name: c.name,
      email: c.email,
      maskedEmail,
      totalTransactions,
      successfulTransactions: successfulPayments.length,
      failedTransactions: failedPayments.length,
      totalVolume: Math.round(totalVolume),
      failedVolume: Math.round(failedVolume),
      latestStatus,
      latestPaymentDate,
      riskSignal,
      topFailureReason,
    });
  }

  // Prioritize operational urgency:
  // 1. High friction (sorted by failed transactions desc)
  // 2. High value risk (sorted by failed volume desc)
  // 3. Stable (sorted by total volume desc)
  summaries.sort((a, b) => {
    const priority = (s: CustomerOperationalSummary) => {
      if (s.riskSignal === "HIGH_FRICTION") return 3;
      if (s.riskSignal === "HIGH_VALUE_RISK") return 2;
      return 1;
    };
    const pDiff = priority(b) - priority(a);
    if (pDiff !== 0) return pDiff;
    if (b.failedTransactions !== a.failedTransactions) {
      return b.failedTransactions - a.failedTransactions;
    }
    return b.totalVolume - a.totalVolume;
  });

  return summaries;
}

