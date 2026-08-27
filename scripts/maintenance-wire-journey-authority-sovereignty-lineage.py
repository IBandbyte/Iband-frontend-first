from pathlib import Path

path = Path('src/components/studio/mentor/JourneyDurableAuthorityStore.js')
text = path.read_text()

replacements = [
(
'import { withJourneyProgressionProjectLock } from "./JourneyProgressionProjectLock.js";\n',
'import { withJourneyProgressionProjectLock } from "./JourneyProgressionProjectLock.js";\nimport createJourneyAuthoritySovereigntyLineage from "./JourneyAuthoritySovereigntyLineage.js";\n'
),
(
'const JOURNEY_DURABLE_AUTHORITY_STORE_VERSION = "1.1.0";',
'const JOURNEY_DURABLE_AUTHORITY_STORE_VERSION = "1.2.0";'
),
(
'''  if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
    fail("JOURNEY_AUTHORITY_STORAGE_REQUIRED", "Journey authority store requires getItem/setItem storage.");
  }

  function read(projectId, { project = null } = {}) {
    const parsed = parseAuthority(storage.getItem(authorityStorageKey(projectId)), project);
    return parsed ? cloneValue(parsed.record) : null;
  }
''',
'''  if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
    fail("JOURNEY_AUTHORITY_STORAGE_REQUIRED", "Journey authority store requires getItem/setItem storage.");
  }
  const sovereigntyLineage = createJourneyAuthoritySovereigntyLineage({ storage });

  function read(projectId, { project = null } = {}) {
    const parsed = parseAuthority(storage.getItem(authorityStorageKey(projectId)), project);
    if (!parsed) {
      if (project) {
        const absence = sovereigntyLineage.classifyAbsence({ project });
        if (absence.status === "authority-destroyed-or-missing") {
          fail(
            "JOURNEY_AUTHORITY_RECOVERY_REQUIRED",
            "Journey authority is missing but sovereignty lineage proves authority previously existed.",
            { reason: "authority-missing-after-established-lineage" }
          );
        }
      }
      return null;
    }

    const lineageRecord = sovereigntyLineage.read(projectId, { project });
    if (lineageRecord) {
      const generation = safeInteger(parsed.record?.authority?.generation);
      const progressionRevision = effectiveProgressionRevision(parsed.record?.journey);
      if (generation < lineageRecord.highestKnownGeneration || progressionRevision < lineageRecord.highestKnownProgressionRevision) {
        fail(
          "JOURNEY_AUTHORITY_ROLLBACK_DETECTED",
          "Journey authority is below the established sovereignty lineage floor.",
          {
            authorityGeneration: generation,
            highestKnownGeneration: lineageRecord.highestKnownGeneration,
            authorityProgressionRevision: progressionRevision,
            highestKnownProgressionRevision: lineageRecord.highestKnownProgressionRevision,
          }
        );
      }
    }
    return cloneValue(parsed.record);
  }
'''
),
(
'''    const sourceJourney = nativeJourney || legacyJourney;
    validateJourney(sourceJourney, "JOURNEY_AUTHORITY_BOOTSTRAP_SOURCE_INVALID");
    const key = authorityStorageKey(identity.projectId);
    const existing = parseAuthority(storage.getItem(key), project);
    if (existing) {
      return Object.freeze({
''',
'''    const sourceJourney = nativeJourney || legacyJourney;
    const sourceJourneyInspection = validateJourney(sourceJourney, "JOURNEY_AUTHORITY_BOOTSTRAP_SOURCE_INVALID");
    const key = authorityStorageKey(identity.projectId);
    const existing = parseAuthority(storage.getItem(key), project);
    if (existing) {
      sovereigntyLineage.observeAuthorityUnderLock({ project, authorityRecord: existing.record, allowAdoption: true });
      return Object.freeze({
'''
),
(
'''    const candidate = buildAuthorityRecord({ project, projectJourney: sourceJourney, bootstrapSource: source, generation: 0 });
    const persisted = writeCandidate(key, candidate, { project });
    return Object.freeze({
''',
'''    sovereigntyLineage.beginBirthUnderLock({
      project,
      birthJourneyFingerprint: sourceJourneyInspection.fingerprint,
      birthProgressionRevision: sourceJourneyInspection.progressionRevision,
    });
    const candidate = buildAuthorityRecord({ project, projectJourney: sourceJourney, bootstrapSource: source, generation: 0 });
    const persisted = writeCandidate(key, candidate, { project });
    sovereigntyLineage.observeAuthorityUnderLock({ project, authorityRecord: persisted.record });
    return Object.freeze({
'''
),
(
'''    const current = parseAuthority(storage.getItem(key), project);
    if (!current) fail("JOURNEY_AUTHORITY_NOT_INITIALISED", "Journey authority must be bootstrapped before commit.");
    if (current.inspection.generation !== expectedGen) {
''',
'''    const current = parseAuthority(storage.getItem(key), project);
    if (!current) fail("JOURNEY_AUTHORITY_NOT_INITIALISED", "Journey authority must be bootstrapped before commit.");
    sovereigntyLineage.observeAuthorityUnderLock({ project, authorityRecord: current.record, allowAdoption: true });
    if (current.inspection.generation !== expectedGen) {
'''
),
(
'''    const persisted = writeCandidate(key, candidate, { project });
    const inspection = inspectAuthorityRecord(persisted.record, { project });
    return Object.freeze({
''',
'''    const persisted = writeCandidate(key, candidate, { project });
    sovereigntyLineage.observeAuthorityUnderLock({ project, authorityRecord: persisted.record });
    const inspection = inspectAuthorityRecord(persisted.record, { project });
    return Object.freeze({
'''
),
(
'''    compareAndCommitUnderLock,
    compareProjection,
  });
''',
'''    compareAndCommitUnderLock,
    compareProjection,
    readSovereigntyLineage: (projectId, options = {}) => sovereigntyLineage.read(projectId, options),
    classifySovereigntyAbsence: (options = {}) => sovereigntyLineage.classifyAbsence(options),
  });
'''
),
]

for old, new in replacements:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'Expected exactly one match for lineage integration seam, found {count}: {old[:100]!r}')
    text = text.replace(old, new, 1)

path.write_text(text)
print('Journey Durable Authority Store sovereignty lineage integration patched successfully.')
