import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { logger } from "./lib/logger";
import { healthRouter } from "./modules/health/health.routes";
import { apiRouter } from "./routes/api.routes";

export const app = express();

app.disable("x-powered-by");
// Cloud Run sits behind one proxy hop; the login rate limiter needs the real client IP.
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  pinoHttp({
    logger,
    customLogLevel: (_request, response, error) => {
      if (error || response.statusCode >= 500 && response.statusCode !== 503) {
        return "error";
      }

      if (response.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      req: (request) => ({
        id: request.id,
        method: request.method,
        url: request.url,
        remoteAddress: request.remoteAddress,
      }),
      res: (response) => ({
        statusCode: response.statusCode,
      }),
    },
  }),
);
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.get("/", (_request, response) => {
  response.json({ name: "appointment-saas-api", status: "ok" });
});

app.use("/api", apiRouter);
// Preserve the original health URLs while clients migrate to /api/v1.
app.use("/api/health", healthRouter);
app.use(notFoundHandler);
app.use(errorHandler);
