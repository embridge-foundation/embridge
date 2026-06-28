#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { parseEmbridge, stringifyEmbridge } = require('../src');

const root = path.resolve(__dirname, '../../..');
const expectedDir = path.join(root, 'tests/expected');
const expectedFiles = fs.readdirSync(expectedDir)
  .filter((file) => file.endsWith('.json'))
  .sort();

test('stringifyEmbridge output does not introduce parser diagnostics', () => {
  for (const file of expectedFiles) {
    const expectedPath = path.join(expectedDir, file);
    const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
    const expectedDiagnostics = new Set((expected.diagnostics || []).map(diagnosticKey));

    const markdown = stringifyEmbridge(expected);
    const reparsed = parseEmbridge(markdown, { sourceName: file.replace(/\.json$/, '.md') });

    for (const diagnostic of reparsed.diagnostics) {
      assert(
        expectedDiagnostics.has(diagnosticKey(diagnostic)),
        `${file}: introduced diagnostic "${diagnostic.message}"`,
      );
    }
  }
});

console.log('Markdown writer tests passed');

function diagnosticKey(diagnostic) {
  return `${diagnostic.severity}:${diagnostic.message}`;
}

function test(name, fn) {
  try {
    fn();
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.stack || error.message);
    process.exit(1);
  }
}
