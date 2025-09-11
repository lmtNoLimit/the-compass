import { describe, it, expect } from 'vitest';
import { 
  validateAgentMetadata, 
  safeValidateAgentMetadata,
  validateSingleAgentMetadata,
  type AgentMetadataConfig 
} from '../../app/lib/agent-metadata-validator';

describe('Agent Metadata Validator', () => {
  describe('validateAgentMetadata', () => {
    it('should validate a valid configuration', () => {
      const validConfig = {
        agents: {
          'test-agent': {
            name: 'Test Agent',
            description: 'A test agent for validation',
            capabilities: ['testing', 'validation'],
            category: 'demo' as const,
            priority: 100,
            enabled: true
          }
        },
        defaults: {
          fallbackName: 'Default Agent',
          fallbackDescription: 'Default description',
          fallbackCapabilities: ['general']
        }
      };

      const result = validateAgentMetadata(validConfig);
      expect(result).toBeDefined();
      expect(result.agents).toBeDefined();
      expect(result.agents['test-agent']).toBeDefined();
      expect(result.agents['test-agent'].name).toBe('Test Agent');
    });

    it('should throw on invalid configuration', () => {
      const invalidConfig = {
        agents: {
          'test-agent': {
            name: '', // Too short
            description: 'Test',
            capabilities: []
          }
        }
      };

      expect(() => validateAgentMetadata(invalidConfig)).toThrow();
    });

    it('should validate optional fields', () => {
      const configWithOptionals = {
        agents: {
          'test-agent': {
            name: 'Test Agent',
            description: 'A comprehensive test agent with all optional fields',
            capabilities: ['testing'],
            icon: 'test-icon',
            category: 'experimental' as const,
            priority: 50,
            enabled: false
          }
        }
      };

      const result = validateAgentMetadata(configWithOptionals);
      expect(result.agents['test-agent'].icon).toBe('test-icon');
      expect(result.agents['test-agent'].category).toBe('experimental');
      expect(result.agents['test-agent'].priority).toBe(50);
      expect(result.agents['test-agent'].enabled).toBe(false);
    });

    it('should validate category enum values', () => {
      const validCategories = ['general', 'specialized', 'enterprise', 'demo', 'experimental'];
      
      validCategories.forEach(category => {
        const config = {
          agents: {
            'test-agent': {
              name: 'Test Agent',
              description: 'Test agent with valid category',
              capabilities: ['testing'],
              category: category as any
            }
          }
        };

        expect(() => validateAgentMetadata(config)).not.toThrow();
      });

      // Invalid category should throw
      const invalidCategoryConfig = {
        agents: {
          'test-agent': {
            name: 'Test Agent',
            description: 'Test agent with invalid category',
            capabilities: ['testing'],
            category: 'invalid-category' as any
          }
        }
      };

      expect(() => validateAgentMetadata(invalidCategoryConfig)).toThrow();
    });

    it('should validate priority bounds', () => {
      // Valid priority
      const validConfig = {
        agents: {
          'test-agent': {
            name: 'Test Agent',
            description: 'Test agent with valid priority',
            capabilities: ['testing'],
            priority: 500
          }
        }
      };

      expect(() => validateAgentMetadata(validConfig)).not.toThrow();

      // Priority too high
      const highPriorityConfig = {
        agents: {
          'test-agent': {
            name: 'Test Agent',
            description: 'Test agent with high priority',
            capabilities: ['testing'],
            priority: 1000
          }
        }
      };

      expect(() => validateAgentMetadata(highPriorityConfig)).toThrow();

      // Negative priority
      const negativePriorityConfig = {
        agents: {
          'test-agent': {
            name: 'Test Agent',
            description: 'Test agent with negative priority',
            capabilities: ['testing'],
            priority: -1
          }
        }
      };

      expect(() => validateAgentMetadata(negativePriorityConfig)).toThrow();
    });

    it('should validate capabilities constraints', () => {
      // Too many capabilities
      const tooManyCapabilities = Array.from({ length: 21 }, (_, i) => `capability-${i}`);
      const invalidConfig = {
        agents: {
          'test-agent': {
            name: 'Test Agent',
            description: 'Test agent with too many capabilities',
            capabilities: tooManyCapabilities
          }
        }
      };

      expect(() => validateAgentMetadata(invalidConfig)).toThrow();

      // Capability too long
      const longCapabilityConfig = {
        agents: {
          'test-agent': {
            name: 'Test Agent',
            description: 'Test agent with long capability name',
            capabilities: ['a'.repeat(51)] // 51 characters
          }
        }
      };

      expect(() => validateAgentMetadata(longCapabilityConfig)).toThrow();
    });
  });

  describe('safeValidateAgentMetadata', () => {
    it('should return success for valid configuration', () => {
      const validConfig = {
        agents: {
          'test-agent': {
            name: 'Test Agent',
            description: 'A test agent for validation',
            capabilities: ['testing']
          }
        }
      };

      const result = safeValidateAgentMetadata(validConfig);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid configuration', () => {
      const invalidConfig = {
        agents: {
          'test-agent': {
            name: '', // Invalid
            description: 'Test',
            capabilities: []
          }
        }
      };

      const result = safeValidateAgentMetadata(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('validation failed');
    });

    it('should handle unknown errors', () => {
      // Pass null to trigger unknown error path
      const result = safeValidateAgentMetadata(null);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateSingleAgentMetadata', () => {
    it('should validate individual agent metadata', () => {
      const validMetadata = {
        name: 'Test Agent',
        description: 'A test agent for individual validation',
        capabilities: ['testing', 'individual-validation'],
        category: 'demo' as const,
        priority: 200,
        enabled: true
      };

      const result = validateSingleAgentMetadata(validMetadata);
      expect(result.name).toBe('Test Agent');
      expect(result.capabilities).toContain('testing');
      expect(result.category).toBe('demo');
    });

    it('should apply defaults for optional fields', () => {
      const minimalMetadata = {
        name: 'Minimal Agent',
        description: 'Agent with only required fields',
        capabilities: ['minimal']
      };

      const result = validateSingleAgentMetadata(minimalMetadata);
      expect(result.name).toBe('Minimal Agent');
      expect(result.enabled).toBe(true); // Default value
    });

    it('should reject invalid individual metadata', () => {
      const invalidMetadata = {
        name: 'A', // Too short (min 1 char, but description is too short)
        description: 'Short', // Too short (min 10 chars)
        capabilities: []
      };

      expect(() => validateSingleAgentMetadata(invalidMetadata)).toThrow();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty agents object', () => {
      const emptyConfig = {
        agents: {}
      };

      const result = validateAgentMetadata(emptyConfig);
      expect(result.agents).toEqual({});
    });

    it('should handle missing defaults', () => {
      const configWithoutDefaults = {
        agents: {
          'test-agent': {
            name: 'Test Agent',
            description: 'Test agent without defaults',
            capabilities: ['testing']
          }
        }
      };

      const result = validateAgentMetadata(configWithoutDefaults);
      expect(result.agents).toBeDefined();
      expect(result.defaults).toBeUndefined();
    });

    it('should validate description length boundaries', () => {
      // Minimum valid description (10 chars)
      const minDescConfig = {
        agents: {
          'test-agent': {
            name: 'Test Agent',
            description: '1234567890', // Exactly 10 chars
            capabilities: ['testing']
          }
        }
      };

      expect(() => validateAgentMetadata(minDescConfig)).not.toThrow();

      // Maximum valid description (500 chars)
      const maxDescConfig = {
        agents: {
          'test-agent': {
            name: 'Test Agent',
            description: 'a'.repeat(500), // Exactly 500 chars
            capabilities: ['testing']
          }
        }
      };

      expect(() => validateAgentMetadata(maxDescConfig)).not.toThrow();

      // Too long description (501 chars)
      const tooLongDescConfig = {
        agents: {
          'test-agent': {
            name: 'Test Agent',
            description: 'a'.repeat(501), // 501 chars
            capabilities: ['testing']
          }
        }
      };

      expect(() => validateAgentMetadata(tooLongDescConfig)).toThrow();
    });

    it('should validate name length boundaries', () => {
      // Maximum valid name (100 chars)
      const maxNameConfig = {
        agents: {
          'test-agent': {
            name: 'a'.repeat(100), // Exactly 100 chars
            description: 'Test agent with maximum length name',
            capabilities: ['testing']
          }
        }
      };

      expect(() => validateAgentMetadata(maxNameConfig)).not.toThrow();

      // Too long name (101 chars)
      const tooLongNameConfig = {
        agents: {
          'test-agent': {
            name: 'a'.repeat(101), // 101 chars
            description: 'Test agent with too long name',
            capabilities: ['testing']
          }
        }
      };

      expect(() => validateAgentMetadata(tooLongNameConfig)).toThrow();
    });
  });
});