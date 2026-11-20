/**
 * Candidate server-authoritative Creator Memory continuation boundary.
 *
 * This module intentionally NEVER marks a local publication witness as trusted,
 * writes to localStorage, or invokes replaceStateWithSharedAuthority. A trusted
 * server adapter must authenticate the request, verify ownership and provenance,
 * atomically commit the new state and return a durable receipt. This client
 * boundary cannot grant itself that authority.
 *
 * The adapter is a trusted server-side dependency, not an untrusted callback
 * supplied by the browser/user. No application caller is wired to this module.
 */
function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}
function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function fail(reason) {
  return Object.freeze({ acquired: false, reason });
}
async function continueCreatorMemoryWithDurableAuthority({
  projectId, operationId, expectedRevision, authenticatedSession,
  proposedState, authorityAdapter,
} = {}) {
  if (!clean(projectId) || !clean(operationId) ||
      !Number.isSafeInteger(expectedRevision) || expectedRevision < 0 ||
      !authenticatedSession || !proposedState || typeof proposedState !== "object" ||
      Array.isArray(proposedState) ||
      !authorityAdapter || typeof authorityAdapter.commit !== "function" ||
      typeof authorityAdapter.readCommitted !== "function") {
    return fail("durable-authority-input-unavailable");
  }
  // The browser is never allowed to supply an authenticated principal or
  // publication credential in place of the server's own verification.
  try {
    const receipt = await authorityAdapter.commit({
      authenticatedSession, projectId, operationId, expectedRevision,
      proposedState: structuredClone(proposedState),
    });
    if (!receipt || receipt.status !== "committed" ||
        receipt.projectId !== projectId ||
        receipt.operationId !== operationId ||
        !Number.isSafeInteger(receipt.committedRevision) ||
        receipt.committedRevision < expectedRevision ||
        !clean(receipt.serverCommitId)) {
      return fail("durable-commit-unverified");
    }
    const durable = await authorityAdapter.readCommitted({
      authenticatedSession, projectId, operationId,
    });
    if (!durable || durable.projectId !== projectId ||
        durable.operationId !== operationId ||
        durable.committedRevision !== receipt.committedRevision ||
        durable.serverCommitId !== receipt.serverCommitId ||
        !durable.state || !same(durable.state, proposedState)) {
      return fail("durable-readback-mismatch");
    }
    return Object.freeze({
      acquired: true, committedRevision: receipt.committedRevision,
      serverCommitId: receipt.serverCommitId,
      state: structuredClone(durable.state),
    });
  } catch {
    // A transport timeout may occur AFTER server commit. Do not retry with a
    // different operation ID or claim abort; caller must reconcile by ID.
    return fail("durable-outcome-unknown");
  }
}
export { continueCreatorMemoryWithDurableAuthority };
