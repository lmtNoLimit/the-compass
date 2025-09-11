# Quickstart: Dynamic Agent Discovery and Selection

**Feature**: 002-get-the-list  
**Date**: 2025-09-11

## Overview
This guide demonstrates the Dynamic Agent Discovery feature, which allows users to see and select from all deployed AI agents in Vertex AI Agent Engine.

## Prerequisites
- Application running locally (`npm run dev`)
- Valid Vertex AI credentials configured
- At least one agent deployed in Vertex AI Agent Engine

## Feature Validation Steps

### 1. View Available Agents
```bash
# Navigate to the agents page
open http://localhost:3000/agents
```

**Expected Result**:
- Page loads within 2 seconds
- List of agents displayed with name, description, status, and capabilities
- Each agent shows appropriate status indicator (green=active, gray=inactive, red=error)

### 2. Test Agent Search
```bash
# In the agents page, use the search bar
# Type: "enterprise"
```

**Expected Result**:
- Results filter in real-time as you type
- Only agents matching the search term are displayed
- Search works across name, description, and capabilities

### 3. Select an Agent for Chat
```bash
# Click on any active agent card
# Or click the "Select" button on an agent
```

**Expected Result**:
- Visual confirmation of selection (highlighted/checked)
- Redirect to chat interface with selected agent
- Selected agent name displayed in chat header

### 4. Switch Agents Mid-Conversation
```bash
# In chat interface:
# 1. Start a conversation with current agent
# 2. Click agent selector dropdown/button
# 3. Choose a different agent
```

**Expected Result**:
- Warning dialog about conversation context
- Option to preserve or clear history
- New agent selected and ready for use

### 5. Test Error Handling
```bash
# Simulate network failure (browser dev tools)
# Try to load agents page
```

**Expected Result**:
- Appropriate error message displayed
- Retry button available
- Cached data shown if available

### 6. Force Refresh Agent List
```bash
# Click the refresh button on agents page
```

**Expected Result**:
- Loading indicator shown
- Fresh data fetched from Vertex AI
- Cache updated with new data
- Any new agents appear in list

## API Testing

### Get Agents List
```bash
curl -X GET http://localhost:3000/api/agents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response** (Schema: [data-model.md#agentlistresponse](./data-model.md#agentlistresponse)):
```json
{
  "agents": [
    {
      "id": "demo-agent",
      "name": "Demo Agent",
      "description": "Demo health check agent for testing",
      "status": "active",
      "capabilities": ["health-check", "basic-query"]
    }
  ],
  "timestamp": "2025-09-11T10:30:00Z",
  "cached": false,
  "totalCount": 1
}
```

**Contract Validation**: See [contracts/openapi.yaml#/paths/~1agents](./contracts/openapi.yaml#/paths/~1agents)

### Select an Agent
```bash
curl -X POST http://localhost:3000/api/agents/select \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "demo-agent",
    "preserveHistory": true,
    "context": {
      "source": "agents-page"
    }
  }'
```

**Request Schema**: [data-model.md#agentselectionrequest](./data-model.md#agentselectionrequest)  
**Expected Response** (Schema: [data-model.md#agentselectionresponse](./data-model.md#agentselectionresponse)):
```json
{
  "success": true,
  "agentId": "demo-agent",
  "timestamp": "2025-09-11T10:31:00Z"
}
```

**Contract Validation**: See [contracts/openapi.yaml#/paths/~1agents~1select](./contracts/openapi.yaml#/paths/~1agents~1select)

## Performance Validation

### Load Time Metrics
```javascript
// Run in browser console on agents page
performance.mark('agents-start');
fetch('/api/agents').then(() => {
  performance.mark('agents-end');
  performance.measure('agents-load', 'agents-start', 'agents-end');
  const measure = performance.getEntriesByName('agents-load')[0];
  console.log(`Agent list loaded in ${measure.duration}ms`);
});
```

**Expected**: < 500ms for API call

### Cache Effectiveness
```javascript
// First call (cache miss)
await fetch('/api/agents');
// Second call (cache hit)
const start = performance.now();
await fetch('/api/agents');
const duration = performance.now() - start;
console.log(`Cached response in ${duration}ms`);
```

**Expected**: < 50ms for cached response

## Integration Tests

### Test 1: Complete User Journey
```typescript
// tests/integration/agents.test.ts
test('User can discover and select agent', async () => {
  // 1. Navigate to agents page
  await page.goto('/agents');
  
  // 2. Verify agents loaded
  await expect(page.locator('[data-testid="agent-card"]')).toHaveCount(greaterThan(0));
  
  // 3. Search for specific agent
  await page.fill('[data-testid="agent-search"]', 'demo');
  await expect(page.locator('[data-testid="agent-card"]')).toHaveCount(1);
  
  // 4. Select agent
  await page.click('[data-testid="select-agent-demo-agent"]');
  
  // 5. Verify redirect to chat
  await expect(page).toHaveURL('/chat');
  await expect(page.locator('[data-testid="current-agent"]')).toHaveText('Demo Agent');
});
```

### Test 2: Error Recovery
```typescript
test('Handles API failure gracefully', async () => {
  // Mock API failure
  await page.route('/api/agents', route => route.abort());
  
  // Navigate to page
  await page.goto('/agents');
  
  // Verify error message
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  
  // Restore API and retry
  await page.unroute('/api/agents');
  await page.click('[data-testid="retry-button"]');
  
  // Verify success
  await expect(page.locator('[data-testid="agent-card"]')).toHaveCount(greaterThan(0));
});
```

## Troubleshooting

### No Agents Displayed
1. Check Vertex AI credentials: `echo $GOOGLE_CLOUD_PROJECT_ID`
2. Verify agent deployment: `gcloud ai reasoning-engines list`
3. Check browser console for errors
4. Verify API response: Network tab in dev tools

### Agent Selection Not Working
1. Ensure agent status is "active"
2. Check session storage for conflicts
3. Verify authentication token is valid
4. Clear browser cache and retry

### Slow Performance
1. Check network latency to Vertex AI
2. Verify cache is working (check response headers)
3. Monitor API response times in server logs
4. Consider increasing cache TTL if appropriate

## Success Criteria Checklist

- [ ] Agents page loads successfully
- [ ] All deployed agents are displayed
- [ ] Search functionality works correctly
- [ ] Agent selection updates chat interface
- [ ] Error states handled gracefully
- [ ] Cache improves performance
- [ ] Refresh fetches latest data
- [ ] API endpoints return expected responses
- [ ] Performance meets targets (<500ms API, <50ms UI)
- [ ] Integration tests pass

## Next Steps

After validating the basic functionality:
1. Test with multiple agents deployed
2. Verify behavior with 10+ agents (pagination/scrolling)
3. Test agent switching during active conversation
4. Validate cache invalidation scenarios
5. Monitor production metrics for optimization opportunities