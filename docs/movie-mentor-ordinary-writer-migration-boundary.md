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

## Exact-head evidence update: 7fa9f3bf

- All 30 workflows completed: 29 GREEN, Durable Sync RED.
- The new production writer cutover source court passed. It pins the known live Studio's strict coordinated project/Journey calls, the strict default response generator, and downstream injection validation.
- The three original physical RED steps are unchanged: check-to-commit race, ordinary writer overlap with recovery, and shared writer coordination.
- The downstream memory rebind authority and strict/read-only compatibility court also passed on this exact head.
- This establishes a **known-live-path boundary**, not complete runtime call-graph coverage. The cutover court is a source-pattern verifier, not a browser concurrency simulation.

## Compatibility and migration decision record

**Do not change `createCreatorMemory()` to strict-by-default yet.** The default permissive facade is still exercised by legacy identity/continuity and other test integrations; a global change could break them without proving that every production caller has migrated.

The implementation direction is a controlled, explicit cutover:

1. Preserve the already-strict AI Movie Studio and response-generator defaults.
2. Classify each remaining production facade factory and injected memory service by runtime reachability, rather than counting tests as production consumers.
3. Prefer the existing `replaceStateWithSharedAuthority({locks,transform})` for simple whole-state mutations, and the atomic settlement API for grouped conversation/handoff/recommendation effects. Both must acquire the same shared exclusive authority as recovery.
4. Require an explicit fail-closed result when a browser lock manager is unavailable or refuses the lock; never silently fall back to legacy synchronous `replaceState`.
5. Before retiring the permissive default, introduce adversarial courts that exercise the actual migrated callers against concurrent recovery and stale durable state, and separately establish the compatibility contract for legacy offline/test-only adapters.
6. Keep the original three courts RED until the unsafe default writer is genuinely fenced or its original contention semantics are satisfied. The current tests explicitly instantiate the permissive default, so a live-Studio-only migration cannot make them GREEN.

**Open architectural decision:** To make the original default-facade courts GREEN, the legacy default must eventually be retired or constrained to a storage mode with proven atomic writes; an ordinary localStorage preflight check cannot satisfy the injected check-to-commit race. Any such change must be accompanied by an explicit compatibility plan and physical regression results.

## Exact-head compatibility court: 92d72c94

- All 30 workflows completed: 29 GREEN and one RED (Durable Sync).
- The Durable Sync job has four genuine RED steps: Studio runtime permissive-memory injection; ordinary writer check-to-commit race; ordinary writer overlap during recovery authority; shared recovery/ordinary writer coordination.
- A strict-brand-only constructor guard on 17a589ec made the new injection court GREEN but regressed multiple pre-existing integration workflows. A narrower permissive-brand rejection on 19682f97 also regressed legacy integrations.
- Inspection of live acceptance, durable settlement, and cockpit continuity scripts shows they construct permissive Creator Memory facades and explicitly inject them into the Studio runtime. Some perform synchronous setup writes before exercising the coordinated workflow. These are real compatibility dependencies of the CI suite, **not proof of production browser reachability**.
- Both attempted constructor guards were rolled back. The new injection court remains RED; no test-only bypass was introduced and the three original contention REDs remain.

### Next migration gate

Do not reintroduce a constructor rejection without a separately verified legacy integration migration. First inventory the exact synchronous setup and runtime mutation calls in each affected verifier, classify their storage/authority assumptions, and register a migration-specific adversarial court. Preserve the old court as an independent compatibility witness until the replacement has passed exact-head CI. Separately verify the actual production Studio entry points do not supply permissive facades; source-only default inspection does not certify every injection path.

## Legacy writer inventory — exact-head source inspection at aa31e542

| Integration court | Legacy setup or injected facade | Recovery-sensitive runtime path | Migration implication |
| --- | --- | --- | --- |
| Studio cockpit continuity | Two permissive facades injected into separate Studio runtimes (lines 15, 24, 37–38) | Coordinated project creation and Journey persistence (lines 26, 30) | The court already exercises shared-authority runtime writes; migration must retain cross-mount identity and Journey assertions while moving its injected facades to strict mode. |
| Live acceptance loop | Permissive facade created (line 31), synchronous `saveProject` fixture setup (line 35), injected into runtime (line 41); permissive reload facade injected (lines 217–218) | Shared-authority conversation settlement (line 90) and reload continuity | Fixture project creation must be migrated to coordinated setup *before* strict injection; do not replace the settlement court with a mock. |
| Durable settlement idempotency | Permissive facades injected into runtimes A/B/C and failure runtime (lines 131–137, 185–186, 220–221); direct permissive convergence test (lines 90–121) | Concurrent `settleConversationMessage` calls (lines 151–153), replay, failure/retry; pending creator messages (lines 148–149) | Separate direct legacy convergence compatibility from Studio runtime injection; preserve exactly-once and failure-retry assertions and the existing serial lock. |
| Project identity continuity | Permissive `saveProject` and `updateProject` setup (lines 12–23) | No Studio constructor injection in this inspected court | Keep as a standalone legacy facade contract until a separate explicit retirement decision; do not count it as proof of live Studio injection. |

These are **verified source call sites in CI scripts**, not a complete repository-wide production call graph. The Studio runtime itself still contains a legacy synchronous `persistJourney` implementation calling `memory.updateProject` (around line 273), while the live workspace uses `persistJourneyWithSharedAuthority`. A legacy recommendation writer throws before its old synchronous mutation code (around lines 338–344). Source reachability and actual lock behaviour must be examined independently before retiring those paths.

**Sequencing:** first build a physical migration court for cockpit continuity (already shared-authority-only); then tackle live acceptance's synchronous fixture creation; finally separate durable settlement's direct compatibility witness from its injected-runtime test. Preserve all existing courts until equivalent assertions have passed on the same exact head. No runtime repair is authorized by this inventory alone.
