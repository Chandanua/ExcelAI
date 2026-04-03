import { RequestHandler } from "express";
import {
  startWatcher,
  stopWatcher,
  stopAllWatchers,
  getAllRows,
} from "../services/excelWatcher";
import { getStatistics, getAllTrackingRecords } from "../services/trackingService";
import { logger } from "../utils/logger";
import path from "path";
import fs from "fs";
import multer from "multer";
import { processRowAndSendEmail, processAllRows, sendManualBroadcast } from "../services/automationEngine";

let watcherActive = false;

export const handleGetStats: RequestHandler = async (req, res) => {
  try {
    const excelPath = path.join(process.cwd(), "data", "leads.xlsx");
    const rows = await getAllRows(excelPath);

    const stats = getStatistics();

    const recentActivities = getAllTrackingRecords()
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .slice(0, 10)
      .map((record) => ({
        id: record.id,
        type: record.openedAt ? "opened" : "sent",
        email: record.email,
        timestamp: record.openedAt ? new Date(record.openedAt).toLocaleString() : new Date(record.sentAt).toLocaleString(),
        message: record.openedAt
          ? `Opened at ${record.openedAt}`
          : `Sent at ${record.sentAt}`,
      }));

    res.json({
      stats: {
        totalLeads: rows.length,
        emailsSent: stats.totalEmailsSent,
        emailsOpened: stats.totalEmailsOpened,
        openRate: stats.openRate,
        averageOpenTime: stats.averageOpenTime,
        pendingEmails: Math.max(0, rows.length - stats.totalEmailsSent),
        failedEmails: 0,
      },
      recentActivities,
      isWatching: watcherActive,
    });
  } catch (error) {
    logger.error(`Error getting stats: ${error}`);
    res.status(500).json({ error: "Failed to get statistics" });
  }
};

export const handleStartWatch: RequestHandler = async (req, res) => {
  try {
    const excelPath = path.join(process.cwd(), "data", "leads.xlsx");

    // Create data directory if it doesn't exist
    const dataDir = path.dirname(excelPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Start watching if not already watching
    if (!watcherActive) {
      await startWatcher({
        filePath: excelPath,
        pollInterval: 3000,
        onRowAdded: async (row, rowIndex) => {
          logger.info(`New row added: ${row.email || "unknown"}`);
          // In a production app, you would trigger email generation and sending here
          await processRowAndSendEmail(row, rowIndex, excelPath);
        },
        onRowUpdated: async (row, rowIndex) => {
          logger.info(`Row updated: ${row.email || "unknown"}`);
        },
      });
      watcherActive = true;
    }

    res.json({ success: true, message: "Excel watcher started" });
  } catch (error) {
    logger.error(`Error starting watcher: ${error}`);
    res.status(500).json({ error: "Failed to start watcher" });
  }
};

export const handleStopWatch: RequestHandler = async (req, res) => {
  try {
    const excelPath = path.join(process.cwd(), "data", "leads.xlsx");

    if (watcherActive) {
      stopWatcher(excelPath);
      watcherActive = false;
    }

    res.json({ success: true, message: "Excel watcher stopped" });
  } catch (error) {
    logger.error(`Error stopping watcher: ${error}`);
    res.status(500).json({ error: "Failed to stop watcher" });
  }
};

export const handleManualBroadcast: RequestHandler = async (req, res) => {
  try {
    const { subject, message } = req.body as { subject?: string; message?: string };

    if (!subject || !message) {
      res.status(400).json({ error: "Subject and message are required" });
      return;
    }

    const excelPath = path.join(process.cwd(), "data", "leads.xlsx");
    const result = await sendManualBroadcast(excelPath, subject, message);

    res.json({
      success: true,
      ...result,
    });
    return;
  } catch (error) {
    logger.error(`Error sending manual broadcast: ${error}`);
    res.status(500).json({ error: "Failed to send broadcast" });
    return;
  }
};

export const handleUpload: RequestHandler = async (req, res) => {
  try {
    // Note: File upload requires multer middleware to be configured
    // For now, we'll return a message that file upload is not configured
    const upload = multer({ storage: multer.memoryStorage() });

    upload.single("file")(req, res, async (err: any) => {
      if (err) {
        logger.error(`Error handling file upload: ${err}`);
        return res
          .status(400)
          .json({ success: false, message: "Failed to process uploaded file" });
      }

      const file = (req as any).file as any;

      if (!file || !file.buffer) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const excelPath = path.join(dataDir, "leads.xlsx");

      try {
        await fs.promises.writeFile(excelPath, file.buffer);
      } catch (writeError) {
        logger.error(`Error saving uploaded Excel file: ${writeError}`);
        return res
          .status(500)
          .json({ success: false, message: "Failed to save Excel file" });
      }

      try {
        await processAllRows(excelPath);
      } catch (processError) {
        logger.error(`Error processing uploaded Excel file: ${processError}`);
      }

      return res.json({
        success: true,
        message: "Excel file uploaded and processed successfully",
      });
    });
  } catch (error) {
    logger.error(`Error uploading file: ${error}`);
    res.status(500).json({ error: "Failed to upload file" });
  }
};
