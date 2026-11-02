# Movie Mentor ordinary writer migration boundary

## Evidence at exact head 862ff662 (prior to this document)

- The strict Studio runtime constructs Creator Memory with `requireSharedWriteAuthority: true`.
- Its project creation and Journey persistence use `replaceStateWithSharedAuthority`, with a fresh Core snapshot under the exclusive shared browser lock.
- The strict ordinary synchronous write isolation court is GREEN; it refuses `replaceState` without invoking durable `setItem`.
- The default `createCreatorMemory()` remains permissive for compatibility. Its synchronous storage controller checks a previously observed durable baseline before `setItem`, but this is **not** an atomic compare-and-swap.
- Three independent courts remain RED: check-to-commit interleaving, overlap with recovery lock, and universal ordinary/recovery coordination.

## Scope distinction

The live AI Movie workspace and conversation wrapper use the strict Studio identity runtime. The separate `ResponseGenerator -> AdaptiveMentorEngine -> CreatorMemoryEngine` mutation chain exists, but source inspection of the two Studio components did not show direct generator construction. This is a narrow reachability observation, **not** a repository-wide absence proof.

## Required migration, not a shortcut

1. Inventory all runtime production call sites constructing a permissive Creator Memory facade, including dependency injection and indirect engine factories. Distinguish source paths from test fixtures.
2. Classify each mutation as a read-only projection, an atomic multi-resource settlement, a simple state transform, or a compatibility-only legacy operation.
3. Route recovery-sensitive production mutations through the shared async lock, reading fresh durable state *inside* authority and refusing when authority is unavailable.
4. Prove cancellation, lock denial, stale-snapshot contention, overlapping recovery, and same-project idempotency with physical adversarial courts.
5. Only after compatibility impact is measured, decide whether to retire or explicitly fence permissive synchronous writes for shared durable storage. Do not silently change the default for legacy integrations.
6. Preserve the three original RED courts until their exact semantics are satisfied. Never mark the facade coordinated by adding a constant without enforcing it.

## Explicit impossibility boundary

A synchronous `getItem` followed by `setItem` cannot guarantee atomic cross-tab commit with ordinary localStorage. An asynchronous browser lock cannot retroactively stop an independent legacy synchronous writer that ignores it. A safe solution requires all relevant writers to participate in the same authority, or a genuinely atomic storage primitive. Source-only coordination assertions do not establish this.

## Release gate

Editable restoration and Phase 01 remain held. No main-branch change, merge, deployment, or production database write is authorised by this document.
