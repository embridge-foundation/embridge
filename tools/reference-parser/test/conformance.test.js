#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');
const { parseEmbridge } = require('../src');

const root = path.resolve(__dirname, '../../..');
const fixturesDir = path.join(root, 'tests/fixtures');
const expectedDir = path.join(root, 'tests/expected');

const fixtures = fs.readdirSync(fixturesDir)
  .filter((file) => file.endsWith('.md'))
  .sort();

let passed = 0;

for (const fixture of fixtures) {
  const base = fixture.replace(/\.md$/, '');
  const inputPath = path.join(fixturesDir, fixture);
  const expectedPath = path.join(expectedDir, `${base}.json`);
  if (!fs.existsSync(expectedPath)) continue;

  const input = fs.readFileSync(inputPath, 'utf8');
  const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
  const actual = parseEmbridge(input, { sourceName: fixture });

  try {
    assert.deepStrictEqual(normalizeForComparison(actual), normalizeForComparison(expected));
    passed += 1;
    console.log(`PASS ${base}`);
  } catch (error) {
    console.error(`FAIL ${base}`);
    console.error(error.message);
    process.exit(1);
  }
}

const cli = spawnSync(process.execPath, [
  path.join(__dirname, '../bin/embridge-parse.js'),
  '--check',
  fixturesDir,
  expectedDir,
], { encoding: 'utf8' });

if (cli.status !== 0) {
  process.stdout.write(cli.stdout);
  process.stderr.write(cli.stderr);
  process.exit(cli.status || 1);
}

console.log('');
console.log(`Conformance tests passed: ${passed}`);

function normalizeForComparison(tree) {
  const clone = JSON.parse(JSON.stringify(tree));
  clone.diagnostics = (clone.diagnostics || []).map((diagnostic) => ({
    line: diagnostic.line,
    severity: diagnostic.severity,
  }));
  return clone;
}
