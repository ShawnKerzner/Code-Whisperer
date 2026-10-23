import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { numberLines, findCrashLine, parseExplanation } from '../parsing';

test('numberLines prefixes each line with its 1-based number', () => {
  assert.equal(numberLines('a\nb'), '1: a\n2: b');
});

test('findCrashLine reads the line number from a Node stack trace', () => {
  const stderr = 'TypeError: boom\n    at getUserName (/app/crash.js:3:22)';
  assert.equal(findCrashLine(stderr), 3);
});

test('findCrashLine returns null when there is no line number', () => {
  assert.equal(findCrashLine('something went wrong'), null);
});

test('parseExplanation parses plain JSON', () => {
  assert.equal(parseExplanation('{"whatWentWrong":"x"}').whatWentWrong, 'x');
});

test('parseExplanation strips markdown code fences', () => {
  const fenced = '```json\n{"whatWentWrong":"x"}\n```';
  assert.equal(parseExplanation(fenced).whatWentWrong, 'x');
});

test('parseExplanation throws on invalid JSON', () => {
  assert.throws(() => parseExplanation('not json'));
});