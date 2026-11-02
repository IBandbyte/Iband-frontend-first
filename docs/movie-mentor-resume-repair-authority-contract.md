# Movie Mentor resume-repair authority contract — Phase 01

Status: RED CONFIRMED at exact head 505ac851164a8edad5e6de2c7224b2154f5601c0. This is a design gate, not release certification.

## Physical entrypoint
CreatorWorkspace.jsx calls identityRuntime.getResumeSnapshot() synchronously from React useMemo during render. getResumeSnapshot() calls certifyJourneyRecommendationResume() synchronously. That calls executeJourneyRecommendationLifecycleRecovery(), and may call quarantineJourneyRecommendationRecoveryConflicts() before retrying. Both write Creator Memory using memory.replaceState() when a repair/quarantine is required. The synchronous render path has no shared Web Lock.

## Required migration
1. Keep render-time snapshot inspection strictly read-only. No write, quarantine, or metadata repair during React render. Return a blocked/pending recommendation state until recovery has been certified.
2. Add a separate async resume-repair operation invoked from a cancellable effect, not from useMemo. Acquire MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION with the same exclusive Web Lock as settlement and durable recovery. Fail closed if locks are missing, denied, or the operation fails.
3. Inside the lock, hydrate fresh durable Creator Memory and rerun lifecycle analysis, quarantine and retry against the latest state. Do not compute a repair from the stale render-time cache. Preserve existing conflict-proof, Journey revision, recommendation identity and quarantine checks.
4. On success, adopt the fresh committed snapshot without a second durable write, then publish the resumed view. On refusal or failure, keep recommendation actions blocked and retain existing local work.
5. Keep public synchronous getResumeSnapshot() compatibility as a read-only view. Do not silently return a Promise or run an async operation from render.
6. Add a physical two-client lock contention court, stale-cache/reload court, denied-lock court, conflict-quarantine evidence preservation court, and fresh-browser creator journey E2E before editable restoration.

## Guardrails
Original four authority REDs remain unchanged. No production database writes, merge, deployment, or main-branch changes. This document alone is not a GREEN for resume-repair authority.
