import { z } from 'zod';

// JSON Schema validation using Zod for type safety
export const AgentMetadataSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(500),
  capabilities: z.array(z.string().min(1).max(50)).min(0).max(20),
  icon: z.string().optional(),
  category: z.enum(['general', 'specialized', 'enterprise', 'demo', 'experimental']).optional(),
  priority: z.number().int().min(0).max(999).optional(),
  enabled: z.boolean().default(true)
});

export const DefaultSettingsSchema = z.object({
  fallbackName: z.string().default('Unnamed Agent'),
  fallbackDescription: z.string().default('AI Agent deployed in Vertex AI'),
  fallbackCapabilities: z.array(z.string()).default(['general'])
});

export const AgentMetadataConfigSchema = z.object({
  agents: z.record(z.string(), AgentMetadataSchema),
  defaults: DefaultSettingsSchema.optional()
});

export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;
export type DefaultSettings = z.infer<typeof DefaultSettingsSchema>;
export type AgentMetadataConfig = z.infer<typeof AgentMetadataConfigSchema>;

/**
 * Validates agent metadata configuration against the schema
 */
export function validateAgentMetadata(config: unknown): AgentMetadataConfig {
  return AgentMetadataConfigSchema.parse(config);
}

/**
 * Safely validates agent metadata configuration with error handling
 */
export function safeValidateAgentMetadata(config: unknown): {
  success: boolean;
  data?: AgentMetadataConfig;
  error?: string;
} {
  try {
    const validatedConfig = AgentMetadataConfigSchema.parse(config);
    return { success: true, data: validatedConfig };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Agent metadata validation failed: ${error.errors?.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') || 'Unknown validation error'}` 
      };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown validation error' };
  }
}

/**
 * Validates individual agent metadata
 */
export function validateSingleAgentMetadata(metadata: unknown): AgentMetadata {
  return AgentMetadataSchema.parse(metadata);
}