#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { parseEmbridge } = require('../src');

const args = process.argv.slice(2);

if (args[0] === '--check') {
  const fixturesDir = args[1];
  const expectedDir = args[2];
  if (!fixturesDir || !expectedDir) usage(1);
  const ok = checkFixtures(fixturesDir, expectedDir);
  process.exit(ok ? 0 : 1);
}

if (args.length !== 1) usage(1);

const inputPath = args[0];
const input = fs.readFileSync(inputPath, 'utf8');
const result = parseEmbridge(input, { sourceName: inputPath });
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

function usage(exitCode) {
  const text = [
    'Usage:',
    '  embridge-parse <file.md>',
    '  embridge-parse --check <fixtures-dir> <expected-dir>',
  ].join('\n');
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function checkFixtures(fixturesDir, expectedDir) {
  const fixtures = fs.readdirSync(fixturesDir)
    .filter((file) => file.endsWith('.md'))
    .sort();

  let passed = 0;
  let failed = 0;

  for (const fixture of fixtures) {
    const base = fixture.replace(/\.md$/, '');
    const expectedPath = path.join(expectedDir, `${base}.json`);
    if (!fs.existsSync(expectedPath)) continue;

    const input = fs.readFileSync(path.join(fixturesDir, fixture), 'utf8');
    const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
    const actual = parseEmbridge(input, { sourceName: fixture });

    if (matchesExpected(actual, expected)) {
      passed += 1;
      console.log(`PASS ${base}`);
    } else {
      failed += 1;
      console.log(`FAIL ${base}`);
      const diff = firstDifference(actual, expected);
      if (diff) console.log(`  ${diff}`);
    }
  }

  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

function matchesExpected(actual, expected) {
  return JSON.stringify(normalizeForComparison(actual)) === JSON.stringify(normalizeForComparison(expected));
}

function normalizeForComparison(tree) {
  const clone = JSON.parse(JSON.stringify(tree));
  clone.diagnostics = (clone.diagnostics || []).map((diagnostic) => ({
    line: diagnostic.line,
    severity: diagnostic.severity,
  }));
  return clone;
}

function firstDifference(actual, expected) {
  const actualNorm = normalizeForComparison(actual);
  const expectedNorm = normalizeForComparison(expected);
  return walkDiff(actualNorm, expectedNorm, '$');
}

function walkDiff(actual, expected, pathName) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) return null;
  if (typeof actual !== typeof expected) return `${pathName}: got ${typeof actual}, expected ${typeof expected}`;
  if (actual === null || expected === null || typeof actual !== 'object') {
    return `${pathName}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`;
  }

  const actualKeys = Array.isArray(actual) ? actual.map((_, i) => String(i)) : Object.keys(actual);
  const expectedKeys = Array.isArray(expected) ? expected.map((_, i) => String(i)) : Object.keys(expected);
  const keys = Array.from(new Set([...actualKeys, ...expectedKeys]));

  for (const key of keys) {
    const diff = walkDiff(actual[key], expected[key], Array.isArray(actual) ? `${pathName}[${key}]` : `${pathName}.${key}`);
    if (diff) return diff;
  }

  return `${pathName}: values differ`;
}
