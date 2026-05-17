import { env } from "../config/env";

/**
 * Basit console-tabanlı logger.
 * Her log mesajına timestamp ve seviye bilgisi ekler.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

const COLORS: Record<LogLevel, string> = {
  info: "\x1b[36m",   // Cyan
  warn: "\x1b[33m",   // Yellow
  error: "\x1b[31m",  // Red
  debug: "\x1b[90m",  // Gray
};

const RESET = "\x1b[0m";

const formatMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  const color = COLORS[level];
  return `${color}[${timestamp}] [${level.toUpperCase()}]${RESET} ${message}`;
};

export const logger = {
  info: (message: string, ...args: unknown[]): void => {
    console.log(formatMessage("info", message), ...args);
  },

  warn: (message: string, ...args: unknown[]): void => {
    console.warn(formatMessage("warn", message), ...args);
  },

  error: (message: string, ...args: unknown[]): void => {
    console.error(formatMessage("error", message), ...args);
  },

  debug: (message: string, ...args: unknown[]): void => {
    if (env.NODE_ENV === "development") {
      console.debug(formatMessage("debug", message), ...args);
    }
  },
};
