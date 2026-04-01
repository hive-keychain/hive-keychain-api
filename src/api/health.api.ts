import { Express } from "express";

/**
 * Liveness/readiness probe for load balancers and process managers.
 * Intentionally avoids DB or external calls so it stays fast and reliable.
 */
const setupApis = (app: Express) => {
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
};

export const HealthApi = {
  setupApis,
};
