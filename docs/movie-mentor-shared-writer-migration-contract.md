# Movie Mentor shared-writer migration contract (Phase 01, verifier-first)

Status: DESIGN / NOT IMPLEMENTED. Editable restoration remains disabled.

## Observed physical failures
At exact head 13819009c5c9be91a6d39a11cb0a1b4e7dc3d645, the Durable Sync workflow failed four independently registered steps: ordinary writer check-to-commit race; studio project creation overlap; ordinary writer overlap; shared writer coordination. Do not reuse these verdicts for later heads.

## Invariant
No recovery-sensitive whole-state Creator Memory mutation may persist unless it owns the same exclusive browser Web Lock as recovery, from the final durable read through the durable commit and cache adoption. A synchronous read-then-write baseline check, process-local flag, or advisory marker is not a substitute for a cross-context atomic exclusion boundary.

## Compatibility contract
1. Legacy synchronous Creator Memory methods retain their public return types until each caller is migrated and tested. Do not silently turn them into promises or swallow authority errors.
2. Introduce an explicit asynchronous coordinated mutation entrypoint that acquires the existing shared Web Lock, rereads current durable state *inside* the lock, applies a synchronous transformation to the fresh state, commits exactly once, and refreshes the caller cache without a second durable write.
3. Recovery must use the identical lock name. A denied, absent, or failed lock must fail closed, with a stable typed error and no successful save acknowledgement.
4. Once a caller is migrated, prevent its fallback to the uncoordinated synchronous write path. Unmigrated callers cannot be certified for editable recovery; leave Phase 01 held.
5. The browser-lock critical section must be tested with two independent lock clients sharing the same storage, including contention, delayed callbacks, stale cache, denied lock, and the check-to-commit interleaving. In-memory lock mocks alone are not proof of real browser cross-tab correctness.
6. No production database writes, deployment, merge, or main-branch edits during verification.

## Caller migration inventory (requires exact-head inspection before changes)
- MovieMentorStudioIdentityRuntime.ensureProject -> synchronous memory.saveProject.
- MovieMentorStudioIdentityRuntime.persistJourney -> synchronous memory.updateProject.
- MovieMentorStudioIdentityRuntime.retireSupersededRecommendationReferences -> synchronous memory.replaceState.
- MovieMentorStudioIdentityRuntime.recordRecommendationForMessage -> synchronous memory.saveProjectMemory.
- MovieMentorStudioIdentityRuntime.recordConversationMessage -> synchronous memory.rememberConversation.
- MovieMentorStudioIdentityRuntime.settleConversationMessage -> asynchronous settlement already opts into waiting shared authority; preserve its exact-head GREEN and typed error semantics.
- Other CreatorMemory consumers, including ResponseGenerator, require call-site audit before enabling editable restoration.

## Ordered release gates
A. Preserve four physical RED courts unchanged; add caller-specific verifier before changing each caller.
B. Implement coordinated asynchronous persistence with explicit error propagation and cache adoption.
C. Migrate the actual Studio creator journey callers and prove no legacy fallback.
D. Exercise real cross-tab lock contention and fresh-browser reload recovery; inspect exact-head CI results.
E. Only consider editable restoration after all four RED courts, all migrated caller courts, and full creator journey acceptance are GREEN on the same exact head.
