import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupWebSocket, setIO } from "./websocket";
import { errorHandler } from "./middleware/errorHandler";
import { globalLimiter, authLimiter, registrationLimiter } from "./middleware/rateLimiter";
import helmet from "helmet";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Apply security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind requires unsafe-inline
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"], // WebSocket support
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // May need to adjust based on requirements
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));

// Apply rate limiting
app.use(globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/registration-forms/:slug/submit', registrationLimiter);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Setup WebSocket
  const ioServer = setupWebSocket(server);
  setIO(ioServer);
  log('WebSocket server initialized');

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Error handler middleware (must be last)
  app.use(errorHandler);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown handling
  let isShuttingDown = false;

  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    log(`${signal} received, starting graceful shutdown...`);

    // Stop accepting new connections
    server.close((err) => {
      if (err) {
        log('Error closing HTTP server:', err);
      } else {
        log('HTTP server closed');
      }
    });

    // Close WebSocket connections
    const { getIO } = require('./websocket');
    const io = getIO();
    if (io) {
      io.close(() => {
        log('WebSocket server closed');
      });
    }

    // Give ongoing requests 10 seconds to complete
    setTimeout(() => {
      log('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);

    // Wait for connections to close naturally
    setTimeout(() => {
      log('Graceful shutdown complete');
      process.exit(0);
    }, 1000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    log('Uncaught exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    log('Unhandled rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
  });
})();
