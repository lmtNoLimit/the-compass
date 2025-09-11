/**
 * Agent metrics and performance monitoring
 */

interface AgentMetric {
  operation: string;
  agentId?: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  averageResponseTime: number;
}

class AgentMetricsCollector {
  private metrics: AgentMetric[] = [];
  private cacheMetrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    averageResponseTime: 0
  };

  /**
   * Record a metric for agent operations
   */
  recordMetric(
    operation: string,
    duration: number,
    success: boolean,
    agentId?: string,
    error?: string
  ): void {
    const metric: AgentMetric = {
      operation,
      agentId,
      duration,
      timestamp: new Date(),
      success,
      error
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[METRICS] ${operation}: ${duration}ms (${success ? 'SUCCESS' : 'FAILED'})${agentId ? ` - Agent: ${agentId}` : ''}${error ? ` - Error: ${error}` : ''}`);
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit(responseTime: number = 0): void {
    this.cacheMetrics.hits++;
    this.cacheMetrics.totalRequests++;
    this.updateAverageResponseTime(responseTime);
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(responseTime: number = 0): void {
    this.cacheMetrics.misses++;
    this.cacheMetrics.totalRequests++;
    this.updateAverageResponseTime(responseTime);
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(responseTime: number): void {
    const total = this.cacheMetrics.totalRequests;
    const currentAverage = this.cacheMetrics.averageResponseTime;
    this.cacheMetrics.averageResponseTime = 
      ((currentAverage * (total - 1)) + responseTime) / total;
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    if (this.cacheMetrics.totalRequests === 0) return 0;
    return (this.cacheMetrics.hits / this.cacheMetrics.totalRequests) * 100;
  }

  /**
   * Get performance metrics for specific operation
   */
  getOperationMetrics(operation: string): {
    averageDuration: number;
    successRate: number;
    totalOperations: number;
    recentOperations: AgentMetric[];
  } {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    const recent = operationMetrics.slice(-10); // Last 10 operations
    
    if (operationMetrics.length === 0) {
      return {
        averageDuration: 0,
        successRate: 0,
        totalOperations: 0,
        recentOperations: []
      };
    }

    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    const successfulOps = operationMetrics.filter(m => m.success).length;

    return {
      averageDuration: totalDuration / operationMetrics.length,
      successRate: (successfulOps / operationMetrics.length) * 100,
      totalOperations: operationMetrics.length,
      recentOperations: recent
    };
  }

  /**
   * Get agent-specific metrics
   */
  getAgentMetrics(agentId: string): {
    totalOperations: number;
    averageDuration: number;
    successRate: number;
    operations: string[];
  } {
    const agentMetrics = this.metrics.filter(m => m.agentId === agentId);
    
    if (agentMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        successRate: 0,
        operations: []
      };
    }

    const totalDuration = agentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const successfulOps = agentMetrics.filter(m => m.success).length;
    const operations = [...new Set(agentMetrics.map(m => m.operation))];

    return {
      totalOperations: agentMetrics.length,
      averageDuration: totalDuration / agentMetrics.length,
      successRate: (successfulOps / agentMetrics.length) * 100,
      operations
    };
  }

  /**
   * Get overall performance summary
   */
  getPerformanceSummary(): {
    totalOperations: number;
    averageDuration: number;
    overallSuccessRate: number;
    cacheHitRate: number;
    averageResponseTime: number;
    operationBreakdown: Record<string, number>;
  } {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        overallSuccessRate: 0,
        cacheHitRate: this.getCacheHitRate(),
        averageResponseTime: this.cacheMetrics.averageResponseTime,
        operationBreakdown: {}
      };
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const successfulOps = this.metrics.filter(m => m.success).length;
    
    const operationBreakdown: Record<string, number> = {};
    this.metrics.forEach(m => {
      operationBreakdown[m.operation] = (operationBreakdown[m.operation] || 0) + 1;
    });

    return {
      totalOperations: this.metrics.length,
      averageDuration: totalDuration / this.metrics.length,
      overallSuccessRate: (successfulOps / this.metrics.length) * 100,
      cacheHitRate: this.getCacheHitRate(),
      averageResponseTime: this.cacheMetrics.averageResponseTime,
      operationBreakdown
    };
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = [];
    this.cacheMetrics = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      averageResponseTime: 0
    };
  }

  /**
   * Check if performance targets are met
   */
  checkPerformanceTargets(): {
    agentDiscoveryLatency: { target: number; actual: number; passing: boolean };
    cacheHitRate: { target: number; actual: number; passing: boolean };
    agentSelection: { target: number; actual: number; passing: boolean };
    searchFilter: { target: number; actual: number; passing: boolean };
  } {
    const discoveryMetrics = this.getOperationMetrics('agent-discovery');
    const selectionMetrics = this.getOperationMetrics('agent-selection');
    const searchMetrics = this.getOperationMetrics('search-filter');
    
    return {
      agentDiscoveryLatency: {
        target: 500, // < 500ms (p95)
        actual: discoveryMetrics.averageDuration,
        passing: discoveryMetrics.averageDuration < 500
      },
      cacheHitRate: {
        target: 80, // >= 80%
        actual: this.getCacheHitRate(),
        passing: this.getCacheHitRate() >= 80
      },
      agentSelection: {
        target: 100, // < 100ms
        actual: selectionMetrics.averageDuration,
        passing: selectionMetrics.averageDuration < 100
      },
      searchFilter: {
        target: 50, // < 50ms (client-side)
        actual: searchMetrics.averageDuration,
        passing: searchMetrics.averageDuration < 50
      }
    };
  }
}

// Export singleton instance
export const agentMetrics = new AgentMetricsCollector();

/**
 * Higher-order function to measure operation performance
 */
export function measurePerformance<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T,
  agentId?: string
): T {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;

    try {
      const result = await fn(...args);
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      agentMetrics.recordMetric(operation, duration, success, agentId, error);
    }
  }) as T;
}