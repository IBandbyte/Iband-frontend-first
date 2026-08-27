import {
  inspectJourneyAuthorityRecoveryEnvelope,
  mintJourneyAuthorityRecoveryEnvelope,
} from "./JourneyAuthorityRecoveryEnvelope.js";

const JOURNEY_AUTHORITY_RECOVERY_PUBLICATION_RUNTIME_VERSION = "1.0.0";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

function remoteCoordinates(record) {
  if (!record || typeof record !== "object") return null;
  const recoveryRevision = safeInteger(record.recoveryRevision);
  const authorityGeneration = safeInteger(record.authorityGeneration);
  const progressionRevision = safeInteger(record.progressionRevision);
  const lineageId = cleanString(record.lineageId);
  const envelopeFingerprint = cleanString(record.envelopeFingerprint);
  if (recoveryRevision === null || authorityGeneration === null || progressionRevision === null || !lineageId || !envelopeFingerprint) return null;
  return { recoveryRevision, authorityGeneration, progressionRevision, lineageId, envelopeFingerprint };
}

function classifyRemote(candidateInspection, remoteRecord) {
  const remote = remoteCoordinates(remoteRecord);
  if (!remote) return { status: "remote-invalid" };
  if (remote.lineageId !== candidateInspection.lineageId) {
    return { status: "lineage-conflict", remote };
  }
  if (remote.authorityGeneration === candidateInspection.authorityGeneration &&
      remote.progressionRevision === candidateInspection.progressionRevision) {
    return {
      status: remote.envelopeFingerprint === candidateInspection.envelopeFingerprint
        ? "converged-exact"
        : "split-brain",
      remote,
    };
  }
  if (remote.authorityGeneration >= candidateInspection.authorityGeneration &&
      remote.progressionRevision >= candidateInspection.progressionRevision) {
    return { status: "converged-newer", remote };
  }
  if (remote.authorityGeneration <= candidateInspection.authorityGeneration &&
      remote.progressionRevision <= candidateInspection.progressionRevision) {
    return { status: "publish-needed", remote };
  }
  return { status: "split-brain", remote };
}

function laggingResult(reason, extras = {}) {
  return Object.freeze({
    status: "lagging-retryable",
    recoveryDurability: "lagging",
    creatorJourneyCommitted: true,
    retryable: true,
    reason,
    ...extras,
  });
}

function createJourneyAuthorityRecoveryPublicationRuntime({
  transport,
  mintEnvelope = mintJourneyAuthorityRecoveryEnvelope,
} = {}) {
  if (!transport || typeof transport.readRecovery !== "function" || typeof transport.publishRecovery !== "function") {
    throw Object.assign(new Error("Journey recovery publication requires readRecovery/publishRecovery transport."), {
      code: "JOURNEY_AUTHORITY_RECOVERY_PUBLICATION_TRANSPORT_REQUIRED",
    });
  }

  async function reread(candidateInspection, projectId) {
    try {
      const remote = await transport.readRecovery({ projectId });
      return { ok: true, remote, classification: classifyRemote(candidateInspection, remote) };
    } catch (error) {
      if (error?.code === "MOVIE_MENTOR_JOURNEY_RECOVERY_NOT_FOUND" || error?.code === "JOURNEY_AUTHORITY_RECOVERY_NOT_FOUND") {
        return { ok: true, remote: null, classification: { status: "publish-needed", remote: null } };
      }
      return { ok: false, error };
    }
  }

  async function publishCheckpoint({ project, authorityRecord, lineageRecord } = {}) {
    let envelope;
    try {
      envelope = mintEnvelope({ project, authorityRecord, lineageRecord });
    } catch (error) {
      return Object.freeze({
        status: "invalid-local-authority",
        recoveryDurability: "blocked",
        creatorJourneyCommitted: true,
        retryable: false,
        code: error?.code || "JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_MINT_FAILED",
        reason: error?.reason || error?.message || "recovery-envelope-mint-failed",
      });
    }

    const candidateInspection = inspectJourneyAuthorityRecoveryEnvelope(envelope, { project, lineageRecord });
    if (!candidateInspection.valid) {
      return Object.freeze({
        status: "invalid-local-authority",
        recoveryDurability: "blocked",
        creatorJourneyCommitted: true,
        retryable: false,
        reason: candidateInspection.reason,
      });
    }
    const projectId = cleanString(envelope?.project?.projectId);

    const initial = await reread(candidateInspection, projectId);
    if (!initial.ok) return laggingResult("backend-read-failed", { errorCode: initial.error?.code || null });
    if (["converged-exact", "converged-newer"].includes(initial.classification.status)) {
      return Object.freeze({
        status: initial.classification.status,
        recoveryDurability: "converged",
        creatorJourneyCommitted: true,
        retryable: false,
        envelope: cloneValue(envelope),
        remote: cloneValue(initial.remote),
      });
    }
    if (initial.classification.status === "lineage-conflict") {
      return Object.freeze({ status: "lineage-conflict", recoveryDurability: "blocked", creatorJourneyCommitted: true, retryable: false, remote: cloneValue(initial.remote) });
    }
    if (["split-brain", "remote-invalid"].includes(initial.classification.status)) {
      return Object.freeze({ status: "split-brain", recoveryDurability: "blocked", creatorJourneyCommitted: true, retryable: false, remote: cloneValue(initial.remote) });
    }

    const expectedRecoveryRevision = initial.classification.remote?.recoveryRevision ?? 0;
    try {
      const published = await transport.publishRecovery({
        projectId,
        expectedRecoveryRevision,
        envelope: cloneValue(envelope),
      });
      const classification = classifyRemote(candidateInspection, published);
      if (classification.status === "converged-exact") {
        return Object.freeze({
          status: "published",
          recoveryDurability: "converged",
          creatorJourneyCommitted: true,
          retryable: false,
          envelope: cloneValue(envelope),
          remote: cloneValue(published),
        });
      }
      if (classification.status === "converged-newer") {
        return Object.freeze({ status: "converged-newer", recoveryDurability: "converged", creatorJourneyCommitted: true, retryable: false, envelope: cloneValue(envelope), remote: cloneValue(published) });
      }
      if (classification.status === "lineage-conflict") return Object.freeze({ status: "lineage-conflict", recoveryDurability: "blocked", creatorJourneyCommitted: true, retryable: false, remote: cloneValue(published) });
      return Object.freeze({ status: "split-brain", recoveryDurability: "blocked", creatorJourneyCommitted: true, retryable: false, remote: cloneValue(published) });
    } catch (error) {
      const reconciled = await reread(candidateInspection, projectId);
      if (reconciled.ok) {
        if (["converged-exact", "converged-newer"].includes(reconciled.classification.status)) {
          return Object.freeze({
            status: reconciled.classification.status === "converged-exact" ? "converged-exact" : "converged-newer",
            recoveryDurability: "converged",
            creatorJourneyCommitted: true,
            retryable: false,
            envelope: cloneValue(envelope),
            remote: cloneValue(reconciled.remote),
            reconciledAfterError: true,
          });
        }
        if (reconciled.classification.status === "lineage-conflict") {
          return Object.freeze({ status: "lineage-conflict", recoveryDurability: "blocked", creatorJourneyCommitted: true, retryable: false, remote: cloneValue(reconciled.remote), reconciledAfterError: true });
        }
        if (["split-brain", "remote-invalid"].includes(reconciled.classification.status)) {
          return Object.freeze({ status: "split-brain", recoveryDurability: "blocked", creatorJourneyCommitted: true, retryable: false, remote: cloneValue(reconciled.remote), reconciledAfterError: true });
        }
      }
      return laggingResult("backend-publication-failed", {
        errorCode: error?.code || null,
        expectedRecoveryRevision,
        envelope: cloneValue(envelope),
      });
    }
  }

  return Object.freeze({
    version: JOURNEY_AUTHORITY_RECOVERY_PUBLICATION_RUNTIME_VERSION,
    publishCheckpoint,
    classifyRemote,
  });
}

export {
  JOURNEY_AUTHORITY_RECOVERY_PUBLICATION_RUNTIME_VERSION,
  createJourneyAuthorityRecoveryPublicationRuntime,
  classifyRemote,
};

export default createJourneyAuthorityRecoveryPublicationRuntime;
