import test from 'node:test';
import assert from 'node:assert/strict';
import { ORIGINAL_ANDROID_MANIFEST, ORIGINAL_README } from '../data/originalSpecs';
import {
  DEFAULT_REFINEMENT_OPTIONS,
  auditOriginalSpecs,
  computeLineDiff,
  generateRefinedManifest,
  generateRefinedReadme,
} from './refinementEngine';

test('auditOriginalSpecs detects key contradictions and manifest gaps', () => {
  const findings = auditOriginalSpecs(ORIGINAL_ANDROID_MANIFEST, ORIGINAL_README);
  const ids = findings.map((f) => f.id);

  assert.ok(ids.includes('readme-network-contradiction'));
  assert.ok(ids.includes('readme-voice-contradiction'));
  assert.ok(ids.includes('manifest-missing-rtl'));
  assert.ok(ids.includes('manifest-data-extraction-rules'));
  assert.ok(ids.includes('manifest-mic-hardware-optional'));
});

test('generateRefinedManifest resolves manifest findings when enabled', () => {
  const refined = generateRefinedManifest(DEFAULT_REFINEMENT_OPTIONS);
  assert.match(refined, /android:supportsRtl="true"/);
  assert.match(refined, /android:dataExtractionRules="@xml\/data_extraction_rules"/);
  assert.match(refined, /android\.hardware\.microphone/);
  assert.match(refined, /android:noHistory="true"/);
  assert.match(refined, /android:localeConfig="@xml\/locales_config"/);
});

test('generateRefinedReadme removes contradictions and adds Unicode & Permissions tables', () => {
  const refined = generateRefinedReadme(DEFAULT_REFINEMENT_OPTIONS);
  assert.doesNotMatch(refined, /no network permission/i);
  assert.match(refined, /U\+0684/);
  assert.match(refined, /## Permissions & Privacy/);

  const findingsAfter = auditOriginalSpecs(
    generateRefinedManifest(DEFAULT_REFINEMENT_OPTIONS),
    refined,
  );
  assert.equal(findingsAfter.length, 0);
});

test('computeLineDiff produces added and removed lines cleanly', () => {
  const diff = computeLineDiff('alpha\nbeta\ngamma', 'alpha\nbeta-2\ngamma\ndelta');
  assert.equal(diff.filter((d) => d.type === 'removed').length, 1);
  assert.equal(diff.filter((d) => d.type === 'added').length, 2);
  assert.equal(diff.filter((d) => d.type === 'unchanged').length, 2);
});
