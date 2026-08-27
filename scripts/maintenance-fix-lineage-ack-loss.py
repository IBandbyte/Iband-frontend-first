from pathlib import Path

path = Path('src/components/studio/mentor/JourneyAuthoritySovereigntyLineage.js')
text = path.read_text()
old = '''  function writeVerified(project, candidate) {
    const key = sovereigntyLineageStorageKey(project?.id || project?.projectId);
    const serialized = JSON.stringify(candidate);
    storage.setItem(key, serialized);
    const reread = parse(storage.getItem(key), project);
    if (!reread || JSON.stringify(reread.record) !== serialized) {
      fail("JOURNEY_AUTHORITY_LINEAGE_PERSISTENCE_VERIFICATION_FAILED", "Journey authority lineage write could not be verified.");
    }
    return cloneValue(reread.record);
  }
'''
new = '''  function writeVerified(project, candidate) {
    const key = sovereigntyLineageStorageKey(project?.id || project?.projectId);
    const serialized = JSON.stringify(candidate);
    let writeError = null;
    try { storage.setItem(key, serialized); } catch (error) { writeError = error; }
    const reread = parse(storage.getItem(key), project);
    if (reread && JSON.stringify(reread.record) === serialized) {
      return cloneValue(reread.record);
    }
    if (writeError) throw writeError;
    fail("JOURNEY_AUTHORITY_LINEAGE_PERSISTENCE_VERIFICATION_FAILED", "Journey authority lineage write could not be verified.");
  }
'''
if text.count(old) != 1:
    raise SystemExit(f'Expected exactly one lineage write seam, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
print('Journey Authority lineage ACK-loss reconciliation patched successfully.')
