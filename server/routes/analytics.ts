import { Router, Request, Response } from "express";

const router = Router();

// Simple in-memory storage for analytics (in production, use a proper database)
const performanceMetrics: any[] = [];
const errorLogs: any[] = [];
const slowResources: any[] = [];

// Performance metrics endpoint
router.post(
  "/performance",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { metrics, url, userAgent, timestamp } = req.body;

      const entry = {
        metrics,
        url,
        userAgent: userAgent?.substring(0, 200), // Limit user agent length
        timestamp,
        ip: req.ip,
      };

      performanceMetrics.push(entry);

      // Keep only last 1000 entries
      if (performanceMetrics.length > 1000) {
        performanceMetrics.splice(0, performanceMetrics.length - 1000);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Performance analytics error:", error);
      res.status(500).json({ error: "Failed to log performance metrics" });
    }
  },
);

// Error logging endpoint
router.post("/errors", async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, filename, lineno, colno, stack, reason, url, timestamp } =
      req.body;

    const entry = {
      message: message?.substring(0, 500),
      filename: filename?.substring(0, 200),
      lineno,
      colno,
      stack: stack?.substring(0, 1000),
      reason: reason?.substring(0, 500),
      url,
      timestamp,
      ip: req.ip,
    };

    errorLogs.push(entry);

    // Keep only last 1000 entries
    if (errorLogs.length > 1000) {
      errorLogs.splice(0, errorLogs.length - 1000);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error analytics error:", error);
    res.status(500).json({ error: "Failed to log error" });
  }
});

// Slow resources endpoint
router.post(
  "/slow-resources",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { resources, url, timestamp } = req.body;

      const entry = {
        resources: resources?.slice(0, 10), // Limit to 10 resources
        url,
        timestamp,
        ip: req.ip,
      };

      slowResources.push(entry);

      // Keep only last 500 entries
      if (slowResources.length > 500) {
        slowResources.splice(0, slowResources.length - 500);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Slow resources analytics error:", error);
      res.status(500).json({ error: "Failed to log slow resources" });
    }
  },
);

// Analytics dashboard endpoint (admin only)
router.get("/dashboard", async (req: Request, res: Response): Promise<void> => {
  try {
    // In production, you'd want proper authentication here
    const summary = {
      performanceMetrics: {
        count: performanceMetrics.length,
        recent: performanceMetrics.slice(-10),
        averages: calculateAverages(),
      },
      errorLogs: {
        count: errorLogs.length,
        recent: errorLogs.slice(-10),
      },
      slowResources: {
        count: slowResources.length,
        recent: slowResources.slice(-10),
      },
    };

    res.json(summary);
  } catch (error) {
    console.error("Analytics dashboard error:", error);
    res.status(500).json({ error: "Failed to generate analytics dashboard" });
  }
});

function calculateAverages() {
  if (performanceMetrics.length === 0) return {};

  const totals = {
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
    count: 0,
  };

  performanceMetrics.forEach((entry) => {
    if (entry.metrics) {
      if (entry.metrics.fcp) {
        totals.fcp += entry.metrics.fcp;
        totals.count++;
      }
      if (entry.metrics.lcp) totals.lcp += entry.metrics.lcp;
      if (entry.metrics.fid) totals.fid += entry.metrics.fid;
      if (entry.metrics.cls) totals.cls += entry.metrics.cls;
      if (entry.metrics.ttfb) totals.ttfb += entry.metrics.ttfb;
    }
  });

  return {
    fcp: totals.count > 0 ? totals.fcp / totals.count : 0,
    lcp: totals.count > 0 ? totals.lcp / totals.count : 0,
    fid: totals.count > 0 ? totals.fid / totals.count : 0,
    cls: totals.count > 0 ? totals.cls / totals.count : 0,
    ttfb: totals.count > 0 ? totals.ttfb / totals.count : 0,
  };
}

export default router;
