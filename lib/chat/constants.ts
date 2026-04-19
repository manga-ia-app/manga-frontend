export const CHAT_HISTORY_LIMIT =
  Number(process.env.NEXT_PUBLIC_CHAT_HISTORY_LIMIT) || 50;

export const CHAT_RATE_LIMIT =
  Number(process.env.NEXT_PUBLIC_CHAT_RATE_LIMIT) || 10;

export const CHAT_COOLDOWN_MS = 2000;

export const CHAT_HISTORY_ALERT_THRESHOLD = 0.8;

export const AI_HUB_URL =
  process.env.NEXT_PUBLIC_AI_HUB_URL || "http://localhost:5200/hubs/ai";

export const AI_HEALTH_POLL_INTERVAL_AVAILABLE = 5 * 60 * 1000; // 5 min
export const AI_HEALTH_POLL_INTERVAL_UNAVAILABLE = 30 * 1000; // 30s
