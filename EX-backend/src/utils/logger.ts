import fs from "fs";
import path from "path";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

const LOG_FILE = path.join(process.cwd(), "logs", "app.log");
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

function ensureLogDirectory() {
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

function writeLog(entry: LogEntry) {
  ensureLogDirectory();

  const logLine = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${
    entry.data ? `\n${JSON.stringify(entry.data, null, 2)}` : ""
  }`;

  // Write to console
  const colorMap = {
    debug: "\x1b[36m", // cyan
    info: "\x1b[32m", // green
    warn: "\x1b[33m", // yellow
    error: "\x1b[31m", // red
  };
  const reset = "\x1b[0m";

  console.log(`${colorMap[entry.level]}${logLine}${reset}`);

  // Write to file
  try {
    fs.appendFileSync(LOG_FILE, logLine + "\n");
  } catch (e) {
    console.error("Error writing to log file:", e);
  }
}

export const logger = {
  debug(message: string, data?: any) {
    if (LOG_LEVEL_PRIORITY["debug"] >= LOG_LEVEL_PRIORITY[currentLogLevel]) {
      writeLog({
        timestamp: new Date().toISOString(),
        level: "debug",
        message,
        data,
      });
    }
  },

  info(message: string, data?: any) {
    if (LOG_LEVEL_PRIORITY["info"] >= LOG_LEVEL_PRIORITY[currentLogLevel]) {
      writeLog({
        timestamp: new Date().toISOString(),
        level: "info",
        message,
        data,
      });
    }
  },

  warn(message: string, data?: any) {
    if (LOG_LEVEL_PRIORITY["warn"] >= LOG_LEVEL_PRIORITY[currentLogLevel]) {
      writeLog({
        timestamp: new Date().toISOString(),
        level: "warn",
        message,
        data,
      });
    }
  },

  error(message: string, data?: any) {
    if (LOG_LEVEL_PRIORITY["error"] >= LOG_LEVEL_PRIORITY[currentLogLevel]) {
      writeLog({
        timestamp: new Date().toISOString(),
        level: "error",
        message,
        data,
      });
    }
  },
};
