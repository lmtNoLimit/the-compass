# Sprint Change Proposal: Switch from Render to Vercel Deployment

**Date:** 2025-09-05  
**Prepared by:** Bob (Scrum Master)  
**Change Type:** Technical Platform Correction  

## Executive Summary

Story 1.3 was initially written for Render deployment, but our architecture documents already specify Vercel as the deployment platform. Additionally, React Router v7 has official deployment documentation and tooling for Vercel (`@vercel/react-router`) but not for Render. This change aligns our implementation with both our documented architecture and React Router best practices.

## 1. Identified Issue

**Issue:** Story 1.3 targets Render deployment, but:
- Architecture documents specify Vercel as the deployment platform
- React Router v7 has official Vercel deployment support via `@vercel/react-router`
- No official React Router deployment guide exists for Render

**Impact:** Using Render would diverge from documented architecture and lack official support.

## 2. Epic Impact Summary

**Current Epic:** Epic 1 - Foundation & Authentication Infrastructure
- **Story 1.3:** Needs complete rewrite for Vercel (from Render)
- **Other Stories:** No impact - all other stories are platform-agnostic
- **Future Epics:** No impact - improved alignment with React Router patterns

## 3. Artifact Updates Completed

### Files Modified:
1. ✅ **react-router.config.ts** - Added Vercel preset configuration
2. ✅ **package.json** - Added @vercel/react-router dev dependency
3. ✅ **README.md** - Updated deployment section from Render to Vercel
4. ✅ **.env.example** - Updated deployment variables for Vercel
5. ✅ **docs/stories/1.3.story.md** - Marked as superseded

### Files Created:
1. ✅ **docs/stories/1.3-vercel-deployment.md** - New story for Vercel deployment

### Files to Remove (cleanup):
1. **render.yaml** - No longer needed with Vercel preset

## 4. Recommended Path Forward

**Selected Approach:** Direct Adjustment - Rewrite Story 1.3 for Vercel

**Rationale:**
- Aligns with existing architecture documentation
- Leverages official React Router deployment support
- Simpler configuration (one preset vs manual config file)
- Better integration with React Router v7 SSR capabilities
- No work thrown away (health check endpoint and tests remain valid)

## 5. Implementation Details

### Technical Changes:
- **Deployment Method:** Vercel preset in react-router.config.ts
- **Configuration:** `@vercel/react-router` handles all deployment settings
- **API Routes:** Use React Router's `/api/*` pattern for serverless functions
- **Environment Variables:** Configure in Vercel dashboard (not in config files)

### Story Changes:
- Title: "Configure Vercel Deployment Pipeline"
- All tasks updated for Vercel-specific steps
- Removed render.yaml configuration task
- Added Vercel preset configuration task
- Updated environment variable configuration for Vercel dashboard

## 6. Action Plan

### Immediate Actions:
1. ✅ Install @vercel/react-router dependency
2. ✅ Update react-router.config.ts with Vercel preset
3. ✅ Update Story 1.3 documentation
4. ✅ Update README and .env.example
5. ⏳ Remove render.yaml file
6. ⏳ Implement Story 1.3 tasks (Dev Agent)

### Next Steps:
1. **Dev Agent:** Implement the rewritten Story 1.3-vercel-deployment.md
2. **Dev Agent:** Create /api/health route using React Router patterns
3. **Manual:** Set up Vercel project and connect GitHub repository
4. **Manual:** Configure environment variables in Vercel dashboard
5. **QA Agent:** Review deployment once complete

## 7. Risk Assessment

**Risks:** Minimal
- No technical risks (better platform support)
- No timeline impact (similar effort)
- No feature impact (same capabilities)
- Reduced maintenance risk (official support)

## 8. Benefits of Change

1. **Official Support:** React Router team maintains Vercel integration
2. **Simpler Config:** One preset vs manual configuration files
3. **Better Performance:** Vercel Edge Network optimized for React Router
4. **Alignment:** Matches our documented architecture
5. **Future-Proof:** Following React Router recommended patterns

## User Approval

**Status:** ✅ Change Approved  
**Approved by:** User (via incremental review process)  
**Implementation:** Ready to proceed with Story 1.3-vercel-deployment.md

---

## Checklist Completion Summary

- [x] **Section 1:** Change trigger identified (lack of React Router docs for Render)
- [x] **Section 2:** Epic impact assessed (only Story 1.3 affected)
- [x] **Section 3:** Artifacts reviewed and updated
- [x] **Section 4:** Path forward selected (direct adjustment)
- [x] **Section 5:** Sprint change proposal created
- [x] **Section 6:** User approval obtained

## Handoff

**To Dev Agent:** Please implement Story 1.3-vercel-deployment.md following the Vercel deployment pattern with the installed @vercel/react-router preset.