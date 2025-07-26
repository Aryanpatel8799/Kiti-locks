import { useEffect } from "react";

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export function PerformanceMonitor() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    const metrics: Partial<PerformanceMetrics> = {};

    // Measure Core Web Vitals
    const measureWebVitals = () => {
      // First Contentful Paint
      const fcpEntry = performance.getEntriesByName(
        "first-contentful-paint",
      )[0] as PerformanceEntry;
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }

      // Time to First Byte
      const navEntry = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      if (navEntry) {
        metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
      }

      // Use Performance Observer for LCP and FID
      if ("PerformanceObserver" in window) {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            metrics.fid = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ["first-input"] });

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          metrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });

        // Send metrics after page load
        window.addEventListener("load", () => {
          setTimeout(() => {
            sendMetrics(metrics);
          }, 1000);
        });
      }
    };

    // Send metrics to analytics endpoint
    const sendMetrics = (metricsData: Partial<PerformanceMetrics>) => {
      if (Object.keys(metricsData).length === 0) return;

      // Only send in production
      if (process.env.NODE_ENV === "production") {
        fetch("/api/analytics/performance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            metrics: metricsData,
            url: window.location.pathname,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
          }),
        }).catch(console.warn); // Silently fail
      }
    };

    // Resource timing monitoring
    const monitorResources = () => {
      const resources = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      const slowResources = resources.filter(
        (resource) => resource.duration > 1000,
      );

      if (slowResources.length > 0) {
        const slowResourceData = slowResources.map((resource) => ({
          name: resource.name,
          duration: resource.duration,
          size: resource.transferSize,
        }));

        fetch("/api/analytics/slow-resources", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resources: slowResourceData,
            url: window.location.pathname,
            timestamp: Date.now(),
          }),
        }).catch(console.warn);
      }
    };

    // Error monitoring
    const monitorErrors = () => {
      window.addEventListener("error", (event) => {
        fetch("/api/analytics/errors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack,
            url: window.location.pathname,
            timestamp: Date.now(),
          }),
        }).catch(console.warn);
      });

      window.addEventListener("unhandledrejection", (event) => {
        fetch("/api/analytics/errors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "Unhandled Promise Rejection",
            reason: event.reason?.toString(),
            url: window.location.pathname,
            timestamp: Date.now(),
          }),
        }).catch(console.warn);
      });
    };

    measureWebVitals();
    monitorResources();
    monitorErrors();

    return () => {
      // Cleanup observers if needed
    };
  }, []);

  return null;
}

export default PerformanceMonitor;
