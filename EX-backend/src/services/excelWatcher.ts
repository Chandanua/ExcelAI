import fs from "fs";
import path from "path";
import { readExcelFile, writeToExcelFile } from "./excelAdapter";
import { logger } from "../utils/logger";

interface ExcelRow {
  [key: string]: any;
  id?: string;
  email?: string;
  sent?: boolean;
  sentAt?: string;
  opened?: boolean;
  openedAt?: string;
}

interface WatcherConfig {
  filePath: string;
  pollInterval: number;
  onRowAdded?: (row: ExcelRow, rowIndex: number) => Promise<void>;
  onRowUpdated?: (row: ExcelRow, rowIndex: number) => Promise<void>;
}

let watchers: Map<string, NodeJS.Timeout> = new Map();
let lastModified: Map<string, number> = new Map();
let lastRowCount: Map<string, number> = new Map();
let lastRowData: Map<string, ExcelRow[]> = new Map();

export async function startWatcher(config: WatcherConfig) {
  const { filePath, pollInterval = 3000, onRowAdded, onRowUpdated } = config;

  // Normalize path
  const normalizedPath = path.resolve(filePath);

  // Check if already watching
  if (watchers.has(normalizedPath)) {
    logger.info(`Already watching ${normalizedPath}`);
    return;
  }

  logger.info(`Starting to watch ${normalizedPath}`);

  const watcherInterval = setInterval(async () => {
    try {
      // Check if file exists
      if (!fs.existsSync(normalizedPath)) {
        logger.warn(`Excel file not found: ${normalizedPath}`);
        return;
      }

      const stats = fs.statSync(normalizedPath);
      const currentModified = stats.mtime.getTime();
      const previousModified = lastModified.get(normalizedPath) || 0;

      // If file hasn't been modified, skip
      if (currentModified === previousModified) {
        return;
      }

      lastModified.set(normalizedPath, currentModified);

      // Read file
      const rows = await readExcelFile(normalizedPath);
      const previousRows = lastRowData.get(normalizedPath) || [];
      const previousCount = lastRowCount.get(normalizedPath) || 0;

      lastRowData.set(normalizedPath, rows);
      lastRowCount.set(normalizedPath, rows.length);

      // Detect new rows
      if (rows.length > previousCount) {
        for (let i = previousCount; i < rows.length; i++) {
          const row = rows[i];
          logger.info(`New row detected at index ${i}: ${row.email || "unknown"}`);
          if (onRowAdded) {
            await onRowAdded(row, i);
          }
        }
      }

      // Detect updated rows
      for (let i = 0; i < Math.min(rows.length, previousCount); i++) {
        const currentRow = rows[i];
        const previousRow = previousRows[i];

        if (JSON.stringify(currentRow) !== JSON.stringify(previousRow)) {
          logger.info(`Row updated at index ${i}: ${currentRow.email || "unknown"}`);
          if (onRowUpdated) {
            await onRowUpdated(currentRow, i);
          }
        }
      }
    } catch (error) {
      logger.error(`Error in watcher: ${error}`);
    }
  }, pollInterval);

  watchers.set(normalizedPath, watcherInterval);
  logger.info(`Watcher started for ${normalizedPath}`);
}

export function stopWatcher(filePath: string) {
  const normalizedPath = path.resolve(filePath);
  const interval = watchers.get(normalizedPath);

  if (interval) {
    clearInterval(interval);
    watchers.delete(normalizedPath);
    logger.info(`Watcher stopped for ${normalizedPath}`);
  }
}

export function stopAllWatchers() {
  watchers.forEach((interval) => clearInterval(interval));
  watchers.clear();
  lastModified.clear();
  lastRowCount.clear();
  lastRowData.clear();
  logger.info("All watchers stopped");
}

export async function updateRowStatus(
  filePath: string,
  rowIndex: number,
  status: {
    sent?: boolean;
    sentAt?: string;
    opened?: boolean;
    openedAt?: string;
    [key: string]: any;
  }
) {
  try {
    const normalizedPath = path.resolve(filePath);
    const rows = await readExcelFile(normalizedPath);

    if (rowIndex < 0 || rowIndex >= rows.length) {
      throw new Error(`Invalid row index: ${rowIndex}`);
    }

    rows[rowIndex] = {
      ...rows[rowIndex],
      ...status,
    };

    await writeToExcelFile(normalizedPath, rows);
    logger.info(`Updated row ${rowIndex} in ${normalizedPath}`);

    // Update local cache
    const cachedRows = lastRowData.get(normalizedPath) || [];
    cachedRows[rowIndex] = rows[rowIndex];
    lastRowData.set(normalizedPath, cachedRows);
  } catch (error) {
    logger.error(`Error updating row status: ${error}`);
    throw error;
  }
}

export async function getRowData(filePath: string, rowIndex: number) {
  try {
    const normalizedPath = path.resolve(filePath);
    const rows = await readExcelFile(normalizedPath);

    if (rowIndex < 0 || rowIndex >= rows.length) {
      return null;
    }

    return rows[rowIndex];
  } catch (error) {
    logger.error(`Error getting row data: ${error}`);
    return null;
  }
}

export async function getAllRows(filePath: string) {
  try {
    const normalizedPath = path.resolve(filePath);
    return await readExcelFile(normalizedPath);
  } catch (error) {
    logger.error(`Error getting all rows: ${error}`);
    return [];
  }
}
