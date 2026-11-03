# Movie Mentor publication provenance boundary — design gate

Status: DESIGN ONLY. No publishing authority is granted by this document.

## Verified observations

- The coordinated Creator Memory writer persists a pending local outbox intent in the same state replacement.
- Local snapshot fingerprints are deterministic equality hints, not cryptographic signatures.
- Caller-transform history substitution and malformed persisted ledger edits are rejected by their dedicated courts.
- A structurally plausible localStorage rewrite still passes the writer's structural checks. Preserve the plausible-forgery RED.
- Direct, queued, bridge, and flush public sync entry points remain fail-closed. No backend publication is enabled.
- Browser Web Locks coordinate cooperating tabs, not hostile scripts or arbitrary storage writes.

## Required separation of trust

1. **Local intent:** An outbox entry is untrusted scheduling metadata only. Never use its id, digest, status or version as permission to send.
2. **Writer commit:** A cooperating coordinated writer may issue an ephemeral, single-use capability for its own committed snapshot. This is a client workflow guard, not proof to the server. Reject replay, stale snapshots and cross-identity substitution in independent physical courts.
3. **Server authority:** The backend must independently authenticate creator identity, verify current project ownership and expected revision, and enforce idempotent acceptance of an operation identifier. A client-minted ticket or fingerprint is not server authentication.
4. **Recovery:** On restart, locally persisted intent is untrusted. Fetch authoritative server revision and reconcile under the coordinated writer; never blindly replay localStorage.
5. **Acknowledgement:** Mark delivery complete only after a backend response binds the accepted operation and revision to the same authenticated identity. Persist acknowledgement with a separate tested atomicity/idempotency protocol.
6. **Containment:** Until those gates pass, keep syncMovieMentorDurableState rejecting, enqueue returning null, bridge disabled, and no production writes, deploys or merges.

## Independent acceptance courts to implement before enablement

- Same-tab ticket forgery, reuse, double consumption and stale-snapshot substitution.
- Two-tab concurrent writes, crashed tab and lock handoff.
- Browser restart with tampered but well-formed outbox; zero unauthorised network calls.
- Backend owner/revision conflict, repeated operation id, replay after acknowledged response, cross-project and cross-creator substitution.
- Commit succeeded but acknowledgement lost; exactly-once server effect despite retry.
- Recovery of legitimate unsent state without granting authority to an arbitrary persisted blob.

Do not claim a browser-only cryptographic or structural digest solves provenance. The existing plausible-forgery RED remains a release blocker.
