"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthApi = void 0;
/**
 * Liveness/readiness probe for load balancers and process managers.
 * Intentionally avoids DB or external calls so it stays fast and reliable.
 */
const setupApis = (app) => {
    app.get("/health", (_req, res) => {
        res.status(200).json({ status: "ok" });
    });
};
exports.HealthApi = {
    setupApis,
};
//# sourceMappingURL=health.api.js.map