import React, { useState, useEffect, useCallback } from 'react';
import { performanceTracker } from '../utils/performance';
import { definitionBatcher, searchBatcher } from '../utils/request-batcher';
import { useDefinitionCacheStats } from '../hooks/useDefinitions';
import './PerformanceMonitor.css';

interface PerformanceMonitorProps {
  isVisible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onClose?: () => void;
}

interface PerformanceMetrics {
  avgLookupTime: number;
  avgRenderTime: number;
  cacheHitRate: number;
  totalLookups: number;
  memoryUsage: number;
  pendingRequests: number;
  apiResponseTime: number;
  fps: number;
}

export const PerformanceMonitor = React.memo<PerformanceMonitorProps>(({
  isVisible = true,
  position = 'bottom-right',
  onClose
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    avgLookupTime: 0,
    avgRenderTime: 0,
    cacheHitRate: 0,
    totalLookups: 0,
    memoryUsage: 0,
    pendingRequests: 0,
    apiResponseTime: 0,
    fps: 60
  });
  
  const [isMinimized, setIsMinimized] = useState(false);
  const { cacheSize, clearCache } = useDefinitionCacheStats();
  
  // FPS calculation
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;
    
    const calculateFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round(frameCount * 1000 / (currentTime - lastTime))
        }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(calculateFPS);
    };
    
    if (isVisible && !isMinimized) {
      animationId = requestAnimationFrame(calculateFPS);
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isVisible, isMinimized]);
  
  // Update metrics periodically
  useEffect(() => {
    if (!isVisible) return;
    
    const updateMetrics = () => {
      const stats = performanceTracker.getStats();
      const definitionBatcherStats = definitionBatcher.getStats();
      const searchBatcherStats = searchBatcher.getStats();
      
      setMetrics(prev => ({
        avgLookupTime: stats.averageLookupTime,
        avgRenderTime: stats.averageRenderTime,
        cacheHitRate: stats.cacheHitRate,
        totalLookups: stats.totalLookups,
        memoryUsage: performance.memory ? 
          Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0,
        pendingRequests: definitionBatcherStats.pendingRequests + 
          searchBatcherStats.pendingRequests,
        apiResponseTime: stats.lastApiResponseTime || prev.apiResponseTime,
        fps: prev.fps // Keep FPS from animation frame calculation
      }));
    };
    
    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);
    
    return () => clearInterval(interval);
  }, [isVisible]);
  
  const fetchPerformanceStats = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3456/api/v1/performance/stats');
      const data = await response.json();
      
      if (data.success) {
        console.log('Server performance stats:', data.data);
      }
    } catch (error) {
      console.error('Failed to fetch server performance stats:', error);
    }
  }, []);
  
  const toggleMinimized = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);
  
  const formatTime = (ms: number) => {
    return ms < 1 ? '<1ms' : `${Math.round(ms)}ms`;
  };
  
  const formatMemory = (mb: number) => {
    return `${mb}MB`;
  };
  
  const getPerformanceClass = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'critical';
  };
  
  if (!isVisible) return null;
  
  return (
    <div className={`performance-monitor ${position} ${isMinimized ? 'minimized' : ''}`}>
      <div className="performance-header">
        <h3>Performance Monitor</h3>
        <div className="performance-controls">
          <button 
            onClick={toggleMinimized}
            className="control-button"
            aria-label={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="control-button"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {!isMinimized && (
        <div className="performance-content">
          <div className="performance-metric">
            <span className="metric-label">FPS:</span>
            <span className={`metric-value ${getPerformanceClass(60 - metrics.fps, { good: 5, warning: 15 })}`}>
              {metrics.fps}
            </span>
          </div>
          
          <div className="performance-metric">
            <span className="metric-label">Avg Lookup:</span>
            <span className={`metric-value ${getPerformanceClass(metrics.avgLookupTime, { good: 30, warning: 50 })}`}>
              {formatTime(metrics.avgLookupTime)}
            </span>
          </div>
          
          <div className="performance-metric">
            <span className="metric-label">Avg Render:</span>
            <span className={`metric-value ${getPerformanceClass(metrics.avgRenderTime, { good: 16, warning: 33 })}`}>
              {formatTime(metrics.avgRenderTime)}
            </span>
          </div>
          
          <div className="performance-metric">
            <span className="metric-label">Cache Hit Rate:</span>
            <span className={`metric-value ${metrics.cacheHitRate >= 80 ? 'good' : metrics.cacheHitRate >= 60 ? 'warning' : 'critical'}`}>
              {Math.round(metrics.cacheHitRate)}%
            </span>
          </div>
          
          <div className="performance-metric">
            <span className="metric-label">Cache Size:</span>
            <span className="metric-value">{cacheSize} words</span>
          </div>
          
          <div className="performance-metric">
            <span className="metric-label">Memory Usage:</span>
            <span className={`metric-value ${getPerformanceClass(metrics.memoryUsage, { good: 100, warning: 150 })}`}>
              {formatMemory(metrics.memoryUsage)}
            </span>
          </div>
          
          <div className="performance-metric">
            <span className="metric-label">Pending Requests:</span>
            <span className={`metric-value ${metrics.pendingRequests === 0 ? 'good' : 'warning'}`}>
              {metrics.pendingRequests}
            </span>
          </div>
          
          <div className="performance-metric">
            <span className="metric-label">Total Lookups:</span>
            <span className="metric-value">{metrics.totalLookups}</span>
          </div>
          
          <div className="performance-actions">
            <button 
              onClick={clearCache}
              className="action-button"
              title="Clear the definition cache"
            >
              Clear Cache
            </button>
            <button 
              onClick={fetchPerformanceStats}
              className="action-button"
              title="Fetch server performance stats"
            >
              Server Stats
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default PerformanceMonitor;