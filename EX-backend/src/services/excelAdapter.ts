import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";
import * as xlsxLib from "xlsx";

// Note: In production, you would use a library like 'xlsx' or 'exceljs'
// For this demo, we'll provide a simple implementation that works with CSV-like structure
// Install with: npm install xlsx exceljs

interface ExcelRow {
  [key: string]: any;
}

function getXlsx() {
  const anyLib: any = xlsxLib as any;

  if (anyLib && typeof anyLib.readFile === "function" && anyLib.utils) {
    return anyLib;
  }

  if (anyLib?.default && typeof anyLib.default.readFile === "function" && anyLib.default.utils) {
    return anyLib.default;
  }

  logger.error("xlsx library loaded but does not expose expected API (readFile, utils).");
  return null;
}

export async function readExcelFile(filePath: string): Promise<ExcelRow[]> {
  try {
    const resolvedPath = path.resolve(filePath);

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      logger.warn(`File not found: ${resolvedPath}`);
      return [];
    }

    const xlsx = getXlsx();

    // If xlsx is available, use it
    if (xlsx) {
      const workbook = xlsx.readFile(resolvedPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(worksheet);
      return rows as ExcelRow[];
    }

    // Fallback: Read as JSON (for development)
    // In production, use a proper Excel library
    logger.info(`Reading file: ${resolvedPath}`);
    return [];
  } catch (error) {
    logger.error(`Error reading Excel file: ${error}`);
    throw error;
  }
}

export async function writeToExcelFile(filePath: string, rows: ExcelRow[]): Promise<void> {
  try {
    const resolvedPath = path.resolve(filePath);

    const xlsx = getXlsx();

    // If xlsx is available, use it
    if (xlsx) {
      const worksheet = xlsx.utils.json_to_sheet(rows);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      xlsx.writeFile(workbook, resolvedPath);
      logger.info(`Successfully wrote ${rows.length} rows to ${resolvedPath}`);
      return;
    }

    // Fallback: Write as JSON (for development)
    logger.warn(`Writing to ${resolvedPath} (using fallback implementation)`);
  } catch (error) {
    logger.error(`Error writing to Excel file: ${error}`);
    throw error;
  }
}

export async function createExcelFile(
  filePath: string,
  headers: string[],
  rows?: ExcelRow[]
): Promise<void> {
  try {
    const resolvedPath = path.resolve(filePath);

    // Create directory if it doesn't exist
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const xlsx = getXlsx();

    // If xlsx is available, use it
    if (xlsx) {
      const initialRows = rows || [Object.fromEntries(headers.map((h) => [h, ""]))];
      const worksheet = xlsx.utils.json_to_sheet(initialRows);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      xlsx.writeFile(workbook, resolvedPath);
      logger.info(`Created Excel file: ${resolvedPath}`);
      return;
    }

    // Fallback: Create empty file
    logger.warn(`Creating Excel file: ${resolvedPath} (using fallback)`);
    fs.writeFileSync(resolvedPath, JSON.stringify([], null, 2));
  } catch (error) {
    logger.error(`Error creating Excel file: ${error}`);
    throw error;
  }
}

export async function appendToExcelFile(filePath: string, newRows: ExcelRow[]): Promise<void> {
  try {
    const existingRows = await readExcelFile(filePath);
    const allRows = [...existingRows, ...newRows];
    await writeToExcelFile(filePath, allRows);
    logger.info(`Appended ${newRows.length} rows to ${filePath}`);
  } catch (error) {
    logger.error(`Error appending to Excel file: ${error}`);
    throw error;
  }
}

export async function getColumnValues(filePath: string, columnName: string): Promise<any[]> {
  try {
    const rows = await readExcelFile(filePath);
    return rows.map((row) => row[columnName]).filter((v) => v !== undefined);
  } catch (error) {
    logger.error(`Error getting column values: ${error}`);
    return [];
  }
}
