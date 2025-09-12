# Quickstart: Review and Enhance Agent List

**Feature**: Remove fake/mock agents, display only real agents from Agent Engine

## Prerequisites

1. Node.js 20+ installed
2. Access to Vertex AI Agent Engine
3. Valid Google Cloud credentials configured
4. Development server running (`npm run dev`)

## Quick Verification Steps

### 1. Verify Current State (Before Changes)
```bash
# Start the development server
npm run dev

# Navigate to agents page
open http://localhost:3000/agents

# Check current agent list - you should see demo agents like "Demo Agent"
```

### 2. Apply Configuration Changes
```bash
# Update agent metadata to remove demo agents
cat > app/config/agent-metadata.json << 'EOF'
{
  "agents": {
    "enterprise-admin-456": {
      "name": "Enterprise Admin",
      "description": "Enterprise IT Administrator persona",
      "capabilities": ["persona-simulation", "interview"],
      "category": "enterprise",
      "priority": 10,
      "enabled": true,
      "isProduction": true
    },
    "general-assistant-789": {
      "name": "General Assistant",
      "description": "General-purpose AI assistant",
      "capabilities": ["general-purpose", "conversation"],
      "category": "general",
      "priority": 1,
      "enabled": true,
      "isProduction": true
    }
  },
  "defaults": {
    "fallbackName": "Vertex AI Agent",
    "fallbackDescription": "An AI agent deployed in Vertex AI Agent Engine",
    "fallbackCapabilities": ["general-purpose"]
  }
}
EOF
```

### 3. Test Agent Filtering
```bash
# Run the contract tests to verify filtering
npm test -- tests/contract/agent-filter.test.ts

# Run integration tests
npm test -- tests/integration/agent-no-demo.test.ts
```

### 4. Verify in Browser
```bash
# Refresh the agents page
open http://localhost:3000/agents?refresh=true

# Verify:
# - No "Demo Agent" appears in the list
# - Only production agents are shown
# - Empty state appears if no agents available
```

### 5. Test API Directly
```bash
# Get agent list via API
curl http://localhost:3000/api/agents | jq '.agents[] | {id, name, category: .metadata.category}'

# Should NOT see any agents with:
# - id containing "demo", "test", "mock"
# - category of "demo" or "test"
```

## Acceptance Criteria Verification

### ✅ Scenario 1: Only Real Agents Displayed
1. Navigate to `/agents`
2. Observe agent list
3. **Expected**: No demo/test/mock agents visible

### ✅ Scenario 2: Empty State When No Agents
1. Remove all agents from config
2. Navigate to `/agents`
3. **Expected**: "No agents are currently available" message

### ✅ Scenario 3: Real Agents Show Correctly
1. Ensure real agents in Vertex AI
2. Navigate to `/agents?refresh=true`
3. **Expected**: All real agents displayed with correct names

### ✅ Scenario 4: No Fake Agents Anywhere
1. Search entire UI for "demo", "test", "mock"
2. Check agent selector in chat
3. **Expected**: No fake agents found

## Troubleshooting

### Issue: Demo agents still appearing
**Solution**: 
1. Clear browser cache
2. Force refresh: `/agents?refresh=true`
3. Restart dev server

### Issue: No agents showing at all
**Solution**:
1. Check Vertex AI connectivity
2. Verify credentials: `echo $GOOGLE_CLOUD_PROJECT_ID`
3. Check logs for health check failures

### Issue: Test failures
**Solution**:
1. Ensure test environment variables set
2. Run: `npm test -- --no-cache`
3. Check for API rate limits

## Success Metrics

- ✅ Zero demo/test agents in production
- ✅ All contract tests passing
- ✅ Integration tests passing
- ✅ Manual verification complete
- ✅ Empty state handling works

## Rollback Plan

If issues occur:
```bash
# Restore original config
git checkout -- app/config/agent-metadata.json

# Revert code changes
git checkout -- app/lib/agent-engine.server.ts

# Restart server
npm run dev
```

## Next Steps

After successful verification:
1. Commit changes to feature branch
2. Create pull request
3. Deploy to staging environment
4. Monitor agent discovery metrics