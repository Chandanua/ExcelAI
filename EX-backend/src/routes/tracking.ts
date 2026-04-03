import { RequestHandler } from "express";
import { recordEmailOpen, recordLinkClick } from "../services/trackingService";
import { logger } from "../utils/logger";

// Transparent 1x1 GIF pixel
const TRACKING_PIXEL = Buffer.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
  0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x0a, 0x00, 0x01, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x4c, 0x01, 0x00, 0x3b,
]);

export const handleTrackingPixel: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      logger.warn("Tracking pixel requested without ID");
      res.status(400).json({ error: "Tracking ID is required" });
      return;
    }

    // Record the open
    const recorded = await recordEmailOpen(String(id));

    if (!recorded) {
      logger.warn(`Failed to record email open for tracking ID: ${id}`);
    }

    // Return transparent GIF pixel
    res.set("Content-Type", "image/gif");
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.send(TRACKING_PIXEL);
  } catch (error) {
    logger.error(`Error handling tracking pixel: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleTrackingClick: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { link } = req.query;

    if (!id || !link) {
      logger.warn("Tracking click requested without required parameters");
      res.status(400).json({ error: "ID and link are required" });
      return;
    }

    // Record the click
    recordLinkClick(String(id), String(link));

    // Redirect to the actual link
    res.redirect(String(link));
  } catch (error) {
    logger.error(`Error handling tracking click: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
};
