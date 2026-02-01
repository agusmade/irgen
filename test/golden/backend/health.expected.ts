// Generated: health check and metrics adapter
import type { Request, Response } from "express";
import { logger } from "./logger";
export async function healthCheck(req: Request, res: Response) {
  // TODO: Add database connection check if DB is enabled
  const status = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  res.json(status);
}
import client from "prom-client";
// Initialize metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();
export async function metricsCheck(req: Request, res: Response) {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    logger.error("Metrics error", err);
    res.status(500).end(err);
  }
}
