# Testing Strategy

## Testing Pyramid
```
        E2E Tests (Playwright)
       /                      \
    Integration Tests (Vitest)
   /                          \
Unit Tests (Vitest)    Unit Tests (Vitest)
   (Frontend)             (Backend)
```

## Test Organization

### Frontend Tests
```
apps/web/tests/
├── unit/
│   ├── components/
│   └── hooks/
├── integration/
│   └── routes/
└── e2e/
    ├── auth.spec.ts
    ├── brief-creation.spec.ts
    └── validation.spec.ts
```

### Backend Tests
```
apps/api/tests/
├── unit/
│   ├── services/
│   └── repositories/
├── integration/
│   ├── routes/
│   └── agents/
└── fixtures/
    └── test-data.ts
```

## Test Examples

### Frontend Component Test
```typescript
import { render, screen } from '@testing-library/react';
import { BriefForm } from '~/components/features/brief-form';

describe('BriefForm', () => {
  it('renders all required fields', () => {
    render(<BriefForm mode="create" />);
    
    expect(screen.getByLabelText('Feature Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Problem Statement')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Brief' })).toBeInTheDocument();
  });
});
```

### Backend API Test
```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('POST /api/v1/feature-briefs', () => {
  it('creates a new feature brief', async () => {
    const response = await request(app)
      .post('/api/v1/feature-briefs')
      .set('Authorization', 'Bearer test-token')
      .send({
        title: 'Test Feature',
        problemStatement: 'Test problem',
        proposedSolution: 'Test solution',
        targetUser: 'Test users',
        hypothesis: 'Test hypothesis'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

### E2E Test
```typescript
import { test, expect } from '@playwright/test';

test('complete validation flow', async ({ page }) => {
  await page.goto('/');
  await page.click('text=New Brief');
  
  await page.fill('[name=title]', 'E2E Test Feature');
  await page.fill('[name=problemStatement]', 'E2E test problem');
  await page.fill('[name=proposedSolution]', 'E2E test solution');
  
  await page.click('text=Create Brief');
  await page.waitForURL('/briefs/*');
  
  await page.click('text=Validate');
  await page.click('text=Enterprise Admin');
  await page.click('text=Start Validation');
  
  await page.waitForSelector('text=Validation Complete', { timeout: 60000 });
  expect(page.locator('text=Perceived Value')).toBeVisible();
});
```
