# Data Models

## User
**Purpose:** Represents authenticated users (Product Managers) in the system

**Key Attributes:**
- id: UUID - Unique identifier from Clerk
- email: string - User's email address
- name: string - Display name
- organization: string - Company/org name
- role: enum('admin', 'user') - User role for permissions
- createdAt: timestamp - Account creation date
- lastLoginAt: timestamp - Last activity tracking

**TypeScript Interface:**
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  organization?: string;
  role: 'admin' | 'user';
  createdAt: Date;
  lastLoginAt: Date;
}
```

**Relationships:**
- Has many FeatureBriefs
- Has many ValidationBriefs

## FeatureBrief
**Purpose:** Captures the initial product idea input from PMs

**Key Attributes:**
- id: UUID - Unique identifier
- userId: UUID - Creator reference
- title: string - Brief title/name
- problemStatement: string - Problem being solved
- proposedSolution: text - Solution description
- targetUser: string - Target user segment
- hypothesis: text - Success hypothesis
- status: enum('draft', 'submitted', 'validated') - Current state
- createdAt: timestamp - Creation time
- submittedAt: timestamp - Submission time

**TypeScript Interface:**
```typescript
interface FeatureBrief {
  id: string;
  userId: string;
  title: string;
  problemStatement: string;
  proposedSolution: string;
  targetUser: string;
  hypothesis: string;
  status: 'draft' | 'submitted' | 'validated';
  createdAt: Date;
  submittedAt?: Date;
}
```

**Relationships:**
- Belongs to User
- Has one ValidationBrief

## ValidationBrief
**Purpose:** Stores AI-generated validation results from persona interviews

**Key Attributes:**
- id: UUID - Unique identifier  
- featureBriefId: UUID - Source brief reference
- personaId: string - Which persona was interviewed
- perceivedValue: number - Value score (1-10)
- perceivedValueRationale: text - Explanation of value score
- keyObjections: JSONB - Array of main concerns
- riskAssessment: JSONB - Identified risks and severity
- adoptionBarriers: JSONB - Barriers to adoption
- recommendedNextSteps: JSONB - Suggested actions
- interviewTranscript: JSONB - Full Q&A transcript
- generatedAt: timestamp - Generation time
- exportedAt: timestamp - Last export time

**TypeScript Interface:**
```typescript
interface ValidationBrief {
  id: string;
  featureBriefId: string;
  personaId: string;
  perceivedValue: number;
  perceivedValueRationale: string;
  keyObjections: string[];
  riskAssessment: {
    risk: string;
    severity: 'low' | 'medium' | 'high';
    mitigation?: string;
  }[];
  adoptionBarriers: string[];
  recommendedNextSteps: string[];
  interviewTranscript: {
    question: string;
    answer: string;
  }[];
  generatedAt: Date;
  exportedAt?: Date;
}
```

**Relationships:**
- Belongs to FeatureBrief
- References Persona

## Persona
**Purpose:** Defines AI personas available for interviews

**Key Attributes:**
- id: string - Unique identifier (e.g., 'enterprise-admin')
- name: string - Display name
- description: text - Persona background
- role: string - Job title/role
- goals: JSONB - Array of persona goals
- painPoints: JSONB - Array of pain points
- adkAgentConfig: JSONB - ADK agent configuration
- isActive: boolean - Whether persona is available
- createdAt: timestamp - Creation date

**TypeScript Interface:**
```typescript
interface Persona {
  id: string;
  name: string;
  description: string;
  role: string;
  goals: string[];
  painPoints: string[];
  adkAgentConfig: {
    model: string;
    temperature: number;
    tools: string[];
    systemPrompt: string;
  };
  isActive: boolean;
  createdAt: Date;
}
```

**Relationships:**
- Has many ValidationBriefs
