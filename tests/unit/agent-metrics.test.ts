import { describe, it, expect, beforeEach } from 'vitest';
import { agentMetrics, measurePerformance } from '../../app/lib/agent-metrics';

describe('Agent Metrics', () => {
  beforeEach(() => {
    agentMetrics.resetMetrics();
  });

  describe('recordMetric', () => {
    it('should record a successful metric', () => {
      agentMetrics.recordMetric('test-operation', 100, true, 'test-agent');
      
      const operationMetrics = agentMetrics.getOperationMetrics('test-operation');
      expect(operationMetrics.totalOperations).toBe(1);
      expect(operationMetrics.averageDuration).toBe(100);
      expect(operationMetrics.successRate).toBe(100);
    });

    it('should record a failed metric', () => {
      agentMetrics.recordMetric('test-operation', 150, false, 'test-agent', 'Test error');
      
      const operationMetrics = agentMetrics.getOperationMetrics('test-operation');
      expect(operationMetrics.totalOperations).toBe(1);
      expect(operationMetrics.averageDuration).toBe(150);
      expect(operationMetrics.successRate).toBe(0);
    });

    it('should handle multiple metrics for the same operation', () => {
      agentMetrics.recordMetric('test-operation', 100, true);
      agentMetrics.recordMetric('test-operation', 200, true);
      agentMetrics.recordMetric('test-operation', 300, false);
      
      const operationMetrics = agentMetrics.getOperationMetrics('test-operation');
      expect(operationMetrics.totalOperations).toBe(3);
      expect(operationMetrics.averageDuration).toBe(200); // (100 + 200 + 300) / 3
      expect(operationMetrics.successRate).toBe(66.66666666666666); // 2/3 * 100
    });

    it('should limit stored metrics to prevent memory issues', () => {
      // Record more than 1000 metrics
      for (let i = 0; i < 1200; i++) {
        agentMetrics.recordMetric(`operation-${i % 10}`, i, true);
      }

      const summary = agentMetrics.getPerformanceSummary();
      expect(summary.totalOperations).toBe(1000); // Should be capped at 1000
    });
  });

  describe('cache metrics', () => {
    it('should record cache hits and misses', () => {
      agentMetrics.recordCacheHit(50);
      agentMetrics.recordCacheHit(75);
      agentMetrics.recordCacheMiss(200);
      
      expect(agentMetrics.getCacheHitRate()).toBe(66.66666666666666); // 2/3 * 100
      
      const summary = agentMetrics.getPerformanceSummary();
      expect(summary.cacheHitRate).toBe(66.66666666666666);
      expect(summary.averageResponseTime).toBe(108.33333333333333); // (50 + 75 + 200) / 3
    });

    it('should handle zero requests for cache hit rate', () => {
      expect(agentMetrics.getCacheHitRate()).toBe(0);
    });

    it('should update average response time correctly', () => {
      agentMetrics.recordCacheHit(100);
      expect(agentMetrics.getPerformanceSummary().averageResponseTime).toBe(100);
      
      agentMetrics.recordCacheHit(200);
      expect(agentMetrics.getPerformanceSummary().averageResponseTime).toBe(150); // (100 + 200) / 2
      
      agentMetrics.recordCacheMiss(300);
      expect(agentMetrics.getPerformanceSummary().averageResponseTime).toBe(200); // (100 + 200 + 300) / 3
    });
  });

  describe('getOperationMetrics', () => {
    it('should return empty metrics for unknown operation', () => {
      const metrics = agentMetrics.getOperationMetrics('unknown-operation');
      expect(metrics.totalOperations).toBe(0);
      expect(metrics.averageDuration).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.recentOperations).toEqual([]);
    });

    it('should return recent operations (last 10)', () => {
      // Record 15 operations
      for (let i = 0; i < 15; i++) {
        agentMetrics.recordMetric('test-operation', i * 10, true);
      }
      
      const metrics = agentMetrics.getOperationMetrics('test-operation');
      expect(metrics.totalOperations).toBe(15);
      expect(metrics.recentOperations.length).toBe(10); // Only last 10
      
      // Verify it's the last 10 operations (50ms to 140ms)
      const lastOperation = metrics.recentOperations[metrics.recentOperations.length - 1];
      expect(lastOperation.duration).toBe(140); // 14 * 10
    });
  });

  describe('getAgentMetrics', () => {
    it('should return metrics for specific agent', () => {
      agentMetrics.recordMetric('operation-1', 100, true, 'agent-1');
      agentMetrics.recordMetric('operation-2', 200, true, 'agent-1');
      agentMetrics.recordMetric('operation-1', 150, false, 'agent-2');
      
      const agent1Metrics = agentMetrics.getAgentMetrics('agent-1');
      expect(agent1Metrics.totalOperations).toBe(2);
      expect(agent1Metrics.averageDuration).toBe(150); // (100 + 200) / 2
      expect(agent1Metrics.successRate).toBe(100); // Both successful
      expect(agent1Metrics.operations).toEqual(['operation-1', 'operation-2']);
      
      const agent2Metrics = agentMetrics.getAgentMetrics('agent-2');
      expect(agent2Metrics.totalOperations).toBe(1);
      expect(agent2Metrics.successRate).toBe(0); // Failed
    });

    it('should return empty metrics for unknown agent', () => {
      const metrics = agentMetrics.getAgentMetrics('unknown-agent');
      expect(metrics.totalOperations).toBe(0);
      expect(metrics.averageDuration).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.operations).toEqual([]);
    });
  });

  describe('getPerformanceSummary', () => {
    it('should return comprehensive performance summary', () => {
      agentMetrics.recordMetric('operation-1', 100, true, 'agent-1');
      agentMetrics.recordMetric('operation-1', 200, true, 'agent-1');
      agentMetrics.recordMetric('operation-2', 150, false, 'agent-2');
      agentMetrics.recordCacheHit(75);
      agentMetrics.recordCacheMiss(225);
      
      const summary = agentMetrics.getPerformanceSummary();
      expect(summary.totalOperations).toBe(3);
      expect(summary.averageDuration).toBe(150); // (100 + 200 + 150) / 3
      expect(summary.overallSuccessRate).toBe(66.66666666666666); // 2/3 * 100
      expect(summary.cacheHitRate).toBe(50); // 1/2 * 100
      expect(summary.averageResponseTime).toBe(150); // (75 + 225) / 2
      expect(summary.operationBreakdown).toEqual({
        'operation-1': 2,
        'operation-2': 1
      });
    });

    it('should handle empty metrics', () => {
      const summary = agentMetrics.getPerformanceSummary();
      expect(summary.totalOperations).toBe(0);
      expect(summary.averageDuration).toBe(0);
      expect(summary.overallSuccessRate).toBe(0);
      expect(summary.cacheHitRate).toBe(0);
      expect(summary.operationBreakdown).toEqual({});
    });
  });

  describe('checkPerformanceTargets', () => {
    it('should check performance targets against recorded metrics', () => {
      // Record metrics that meet targets
      agentMetrics.recordMetric('agent-discovery', 400, true); // < 500ms target
      agentMetrics.recordMetric('agent-selection', 50, true); // < 100ms target
      agentMetrics.recordMetric('search-filter', 25, true); // < 50ms target
      
      // Add cache hits to meet 80% target
      for (let i = 0; i < 8; i++) {
        agentMetrics.recordCacheHit();
      }
      for (let i = 0; i < 2; i++) {
        agentMetrics.recordCacheMiss();
      }
      
      const targets = agentMetrics.checkPerformanceTargets();
      
      expect(targets.agentDiscoveryLatency.passing).toBe(true);
      expect(targets.agentDiscoveryLatency.actual).toBe(400);
      expect(targets.agentDiscoveryLatency.target).toBe(500);
      
      expect(targets.cacheHitRate.passing).toBe(true);
      expect(targets.cacheHitRate.actual).toBe(80);
      expect(targets.cacheHitRate.target).toBe(80);
      
      expect(targets.agentSelection.passing).toBe(true);
      expect(targets.agentSelection.actual).toBe(50);
      expect(targets.agentSelection.target).toBe(100);
      
      expect(targets.searchFilter.passing).toBe(true);
      expect(targets.searchFilter.actual).toBe(25);
      expect(targets.searchFilter.target).toBe(50);
    });

    it('should identify failing performance targets', () => {
      // Record metrics that exceed targets
      agentMetrics.recordMetric('agent-discovery', 600, true); // > 500ms target
      agentMetrics.recordMetric('agent-selection', 150, true); // > 100ms target
      
      // Low cache hit rate
      agentMetrics.recordCacheHit();
      agentMetrics.recordCacheMiss();
      agentMetrics.recordCacheMiss();
      agentMetrics.recordCacheMiss();
      agentMetrics.recordCacheMiss(); // 20% hit rate
      
      const targets = agentMetrics.checkPerformanceTargets();
      
      expect(targets.agentDiscoveryLatency.passing).toBe(false);
      expect(targets.agentSelection.passing).toBe(false);
      expect(targets.cacheHitRate.passing).toBe(false);
    });
  });

  describe('measurePerformance', () => {
    it('should measure successful async operation', async () => {
      const testFunction = async (value: number) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return value * 2;
      };
      
      const measuredFunction = measurePerformance('test-async', testFunction, 'test-agent');
      const result = await measuredFunction(5);
      
      expect(result).toBe(10);
      
      const operationMetrics = agentMetrics.getOperationMetrics('test-async');
      expect(operationMetrics.totalOperations).toBe(1);
      expect(operationMetrics.successRate).toBe(100);
      expect(operationMetrics.averageDuration).toBeGreaterThan(95); // Should be around 100ms
    });

    it('should measure failed async operation', async () => {
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        throw new Error('Test error');
      };
      
      const measuredFunction = measurePerformance('test-async-error', testFunction);
      
      await expect(measuredFunction()).rejects.toThrow('Test error');
      
      const operationMetrics = agentMetrics.getOperationMetrics('test-async-error');
      expect(operationMetrics.totalOperations).toBe(1);
      expect(operationMetrics.successRate).toBe(0);
    });

    it('should preserve function signature and parameters', async () => {
      const testFunction = async (a: number, b: string, c: boolean) => {
        return { a, b, c };
      };
      
      const measuredFunction = measurePerformance('test-signature', testFunction);
      const result = await measuredFunction(42, 'test', true);
      
      expect(result).toEqual({ a: 42, b: 'test', c: true });
    });
  });

  describe('resetMetrics', () => {
    it('should reset all metrics', () => {
      agentMetrics.recordMetric('test-operation', 100, true);
      agentMetrics.recordCacheHit();
      
      expect(agentMetrics.getPerformanceSummary().totalOperations).toBe(1);
      expect(agentMetrics.getCacheHitRate()).toBe(100);
      
      agentMetrics.resetMetrics();
      
      expect(agentMetrics.getPerformanceSummary().totalOperations).toBe(0);
      expect(agentMetrics.getCacheHitRate()).toBe(0);
    });
  });
});