# Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced from Clerk via webhook)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);

-- Feature Briefs table
CREATE TABLE feature_briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    problem_statement TEXT NOT NULL,
    proposed_solution TEXT NOT NULL,
    target_user VARCHAR(255) NOT NULL,
    hypothesis TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'validated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT title_length CHECK (char_length(title) >= 3)
);

CREATE INDEX idx_feature_briefs_user_id ON feature_briefs(user_id);
CREATE INDEX idx_feature_briefs_status ON feature_briefs(status);
CREATE INDEX idx_feature_briefs_created_at ON feature_briefs(created_at DESC);

-- Personas table
CREATE TABLE personas (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    role VARCHAR(255) NOT NULL,
    goals JSONB NOT NULL DEFAULT '[]'::jsonb,
    pain_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    adk_agent_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_personas_active ON personas(is_active);

-- Validation Briefs table
CREATE TABLE validation_briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_brief_id UUID NOT NULL REFERENCES feature_briefs(id) ON DELETE CASCADE,
    persona_id VARCHAR(100) NOT NULL REFERENCES personas(id),
    perceived_value INTEGER NOT NULL CHECK (perceived_value >= 1 AND perceived_value <= 10),
    perceived_value_rationale TEXT NOT NULL,
    key_objections JSONB NOT NULL DEFAULT '[]'::jsonb,
    risk_assessment JSONB NOT NULL DEFAULT '[]'::jsonb,
    adoption_barriers JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    interview_transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    exported_at TIMESTAMP WITH TIME ZONE,
    processing_time_ms INTEGER,
    CONSTRAINT one_validation_per_brief UNIQUE(feature_brief_id)
);

CREATE INDEX idx_validation_briefs_feature_brief_id ON validation_briefs(feature_brief_id);
CREATE INDEX idx_validation_briefs_persona_id ON validation_briefs(persona_id);
CREATE INDEX idx_validation_briefs_generated_at ON validation_briefs(generated_at DESC);

-- Full-text search indexes
CREATE INDEX idx_feature_briefs_search ON feature_briefs 
    USING gin(to_tsvector('english', title || ' ' || problem_statement || ' ' || proposed_solution));

-- Jobs table for async processing
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    result JSONB,
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE feature_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_briefs ENABLE ROW LEVEL SECURITY;

-- Sample personas data
INSERT INTO personas (id, name, description, role, goals, pain_points, adk_agent_config, is_active) VALUES
('enterprise-admin', 'Enterprise IT Administrator', 'Manages IT infrastructure for a 500+ person company', 'IT Admin', 
 '["Maintain system stability", "Minimize security risks", "Control costs"]'::jsonb,
 '["Complex integrations", "Limited budget", "Security compliance"]'::jsonb,
 '{"model": "gemini-2.5-pro", "temperature": 0.7, "tools": ["database_query", "format_response"]}'::jsonb,
 true),
('end-user', 'End User Employee', 'Regular employee using company tools daily', 'Employee',
 '["Get work done efficiently", "Easy to use tools", "Mobile access"]'::jsonb,
 '["Complicated interfaces", "Too many tools", "Slow performance"]'::jsonb,
 '{"model": "gemini-2.5-pro", "temperature": 0.8, "tools": ["database_query", "format_response"]}'::jsonb,
 true);
```
