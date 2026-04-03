import { logger } from "../utils/logger";
import { updateRowStatus } from "./excelWatcher";

interface EmailTrack {
  id: string;
  email: string;
  messageId: string;
  sentAt: string;
  openedAt?: string;
  excelPath: string;
  rowIndex: number;
  clickedLinks?: string[];
}

// In-memory store for tracking (in production, use a database)
const trackingStore: Map<string, EmailTrack> = new Map();

export function generateTrackingId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function generateTrackingPixelUrl(trackingId: string, baseUrl: string): string {
  return `${baseUrl}/api/track/${trackingId}/pixel`;
}

export function createTrackingRecord(
  email: string,
  messageId: string,
  excelPath: string,
  rowIndex: number
): string {
  const trackingId = generateTrackingId();
  const now = new Date().toISOString();

  trackingStore.set(trackingId, {
    id: trackingId,
    email,
    messageId,
    sentAt: now,
    excelPath,
    rowIndex,
    clickedLinks: [],
  });

  logger.info(`Created tracking record for ${email}`, { trackingId, messageId });

  return trackingId;
}

export async function recordEmailOpen(trackingId: string): Promise<boolean> {
  const record = trackingStore.get(trackingId);

  if (!record) {
    logger.warn(`Tracking record not found: ${trackingId}`);
    return false;
  }

  if (record.openedAt) {
    logger.debug(`Email already opened: ${trackingId}`);
    return true; // Already recorded
  }

  record.openedAt = new Date().toISOString();
  logger.info(`Email opened: ${record.email}`, { trackingId, openedAt: record.openedAt });

  // Update Excel file
  try {
    await updateRowStatus(record.excelPath, record.rowIndex, {
      opened: true,
      openedAt: record.openedAt,
    });
  } catch (error) {
    logger.error(`Error updating Excel with open status: ${error}`);
  }

  return true;
}

export function recordLinkClick(trackingId: string, link: string): boolean {
  const record = trackingStore.get(trackingId);

  if (!record) {
    logger.warn(`Tracking record not found: ${trackingId}`);
    return false;
  }

  if (!record.clickedLinks) {
    record.clickedLinks = [];
  }

  if (!record.clickedLinks.includes(link)) {
    record.clickedLinks.push(link);
    logger.info(`Link clicked: ${link}`, { trackingId, email: record.email });
  }

  return true;
}

export function getTrackingRecord(trackingId: string): EmailTrack | undefined {
  return trackingStore.get(trackingId);
}

export function getAllTrackingRecords(): EmailTrack[] {
  return Array.from(trackingStore.values());
}

export function getStatistics(): {
  totalEmailsSent: number;
  totalEmailsOpened: number;
  openRate: number;
  averageOpenTime: string;
} {
  const records = Array.from(trackingStore.values());
  const totalSent = records.length;
  const totalOpened = records.filter((r) => r.openedAt).length;

  let totalOpenTime = 0;
  let validRecords = 0;

  records.forEach((record) => {
    if (record.openedAt) {
      const sentTime = new Date(record.sentAt).getTime();
      const openedTime = new Date(record.openedAt).getTime();
      const diffMs = openedTime - sentTime;
      totalOpenTime += diffMs;
      validRecords++;
    }
  });

  const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  const averageOpenTimeMs = validRecords > 0 ? totalOpenTime / validRecords : 0;
  const averageOpenTime = formatDuration(averageOpenTimeMs);

  return {
    totalEmailsSent: totalSent,
    totalEmailsOpened: totalOpened,
    openRate,
    averageOpenTime,
  };
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function clearAllTrackingRecords(): void {
  trackingStore.clear();
  logger.info("All tracking records cleared");
}
