import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_PREDICTION_MODEL,
  SARAIKI_ROWS,
  ENGLISH_ROWS,
  getPredictions,
  learnWordInModel,
  forgetWordInModel,
} from './predictionEngine';

test('layouts match SaraikiKey 0.7.0 spec', () => {
  // Saraiki: 4 letter rows (no dedicated number row; row 1 has digits 1-0 as topRight)
  assert.equal(SARAIKI_ROWS.length, 4);
  assert.equal(SARAIKI_ROWS[0][0].topRight, '1');
  assert.equal(SARAIKI_ROWS[0][9].topRight, '0');

  // English: number row + 3 QWERTY rows = 4 rows above bottom row
  assert.equal(ENGLISH_ROWS.length, 4);
  assert.equal(ENGLISH_ROWS[0][0].primary, '1');

  // Classical Saraiki alternates on ج and گ
  const jeem = SARAIKI_ROWS[1].find((k) => k.primary === 'ج');
  assert.deepEqual(jeem?.alternates, ['ڄ', 'ڃ']);
  const gaf = SARAIKI_ROWS[1].find((k) => k.primary === 'گ');
  assert.deepEqual(gaf?.alternates, ['ڳ', 'ڱ', 'غ']);
});

test('prediction model learns a word after one use and forgets it cleanly', () => {
  let model = INITIAL_PREDICTION_MODEL;
  model = learnWordInModel(model, 'saraiki', 'ملتاݨی');

  const suggestions = getPredictions('مل', 'saraiki', model);
  assert.equal(suggestions[0]?.word, 'ملتاݨی');
  assert.equal(suggestions[0]?.isLearned, true);

  model = forgetWordInModel(model, 'saraiki', 'ملتاݨی');
  const afterForget = getPredictions('مل', 'saraiki', model);
  assert.ok(!afterForget.some((s) => s.word === 'ملتاݨی'));
});
