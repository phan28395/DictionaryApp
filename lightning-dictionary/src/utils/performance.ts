export interface PerformanceMetrics {
  hotkeyPressed: number;
  textCaptured: number;
  cacheLookup: number;
  apiCall?: number;
  renderStart: number;
  renderComplete: number;
  totalTime: number;
}

export class PerformanceTracker {
  private marks: Map<string, number> = new Map();
  private metrics: PerformanceMetrics[] = [];

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(): PerformanceMetrics | null {
    const hotkeyPressed = this.marks.get('hotkey-pressed');
    const textCaptured = this.marks.get('text-captured');
    const cacheLookup = this.marks.get('cache-lookup');
    const apiCall = this.marks.get('api-call');
    const renderStart = this.marks.get('render-start');
    const renderComplete = this.marks.get('render-complete');

    if (!hotkeyPressed || !textCaptured || !cacheLookup || !renderStart || !renderComplete) {
      console.error('Missing performance marks');
      return null;
    }

    const metrics: PerformanceMetrics = {
      hotkeyPressed: 0,
      textCaptured: textCaptured - hotkeyPressed,
      cacheLookup: cacheLookup - textCaptured,
      apiCall: apiCall ? apiCall - cacheLookup : undefined,
      renderStart: renderStart - (apiCall || cacheLookup),
      renderComplete: renderComplete - renderStart,
      totalTime: renderComplete - hotkeyPressed
    };

    this.metrics.push(metrics);
    this.marks.clear();

    return metrics;
  }

  getStats(): {
    count: number;
    avgTotal: number;
    minTotal: number;
    maxTotal: number;
    p50Total: number;
    p95Total: number;
    p99Total: number;
    breakdown: {
      textCapture: number;
      cacheLookup: number;
      apiCall: number;
      rendering: number;
    };
  } {
    if (this.metrics.length === 0) {
      return {
        count: 0,
        avgTotal: 0,
        minTotal: 0,
        maxTotal: 0,
        p50Total: 0,
        p95Total: 0,
        p99Total: 0,
        breakdown: {
          textCapture: 0,
          cacheLookup: 0,
          apiCall: 0,
          rendering: 0
        }
      };
    }

    const totals = this.metrics.map(m => m.totalTime).sort((a, b) => a - b);
    const count = totals.length;

    const avgTextCapture = this.metrics.reduce((acc, m) => acc + m.textCaptured, 0) / count;
    const avgCacheLookup = this.metrics.reduce((acc, m) => acc + m.cacheLookup, 0) / count;
    const avgApiCall = this.metrics.filter(m => m.apiCall).reduce((acc, m) => acc + (m.apiCall || 0), 0) / this.metrics.filter(m => m.apiCall).length || 0;
    const avgRendering = this.metrics.reduce((acc, m) => acc + m.renderComplete, 0) / count;

    return {
      count,
      avgTotal: totals.reduce((a, b) => a + b, 0) / count,
      minTotal: totals[0],
      maxTotal: totals[count - 1],
      p50Total: totals[Math.floor(count * 0.5)],
      p95Total: totals[Math.floor(count * 0.95)],
      p99Total: totals[Math.floor(count * 0.99)],
      breakdown: {
        textCapture: avgTextCapture,
        cacheLookup: avgCacheLookup,
        apiCall: avgApiCall,
        rendering: avgRendering
      }
    };
  }

  exportCSV(): string {
    const headers = ['timestamp', 'textCaptured', 'cacheLookup', 'apiCall', 'renderStart', 'renderComplete', 'totalTime'];
    const rows = this.metrics.map(m => [
      new Date().toISOString(),
      m.textCaptured,
      m.cacheLookup,
      m.apiCall || 'N/A',
      m.renderStart,
      m.renderComplete,
      m.totalTime
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  reset(): void {
    this.metrics = [];
    this.marks.clear();
  }
}

export const performanceTracker = new PerformanceTracker();