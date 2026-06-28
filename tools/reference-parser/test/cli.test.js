#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { run } = require('../src/cli');

const root = path.resolve(__dirname, '../../..');
const packageJson = require('../package.json');
const fixturesDir = path.join(root, 'tests/fixtures');
const fullFeatured = path.join(fixturesDir, 'full-featured.md');
const invalidMarker = path.join(fixturesDir, 'edge-no-space-after-marker.md');
const binPath = path.join(__dirname, '../bin/embridge.js');

test('validate exits 0 and prints nothing for clean files', () => {
  const result = runCli(['validate', fullFeatured]);
  assert.strictEqual(result.code, 0);
  assert.strictEqual(result.stdout, '');
  assert.strictEqual(result.stderr, '');
});

test('validate exits 1 and prints diagnostics for parser warnings', () => {
  const result = runCli(['validate', invalidMarker]);
  assert.strictEqual(result.code, 1);
  assert.strictEqual(result.stdout, '');
  assert.match(result.stderr, /edge-no-space-after-marker\.md:1: warning:/);
  assert.match(result.stderr, /space required after marker/);
});

test('validate exits 2 and prints usage when no file is provided', () => {
  const result = runCli(['validate']);
  assert.strictEqual(result.code, 2);
  assert.strictEqual(result.stdout, '');
  assert.match(result.stderr, /Missing file path/);
  assert.match(result.stderr, /Usage: embridge <command> \[options\]/);
});

test('to-json exits 0 and prints parseable JSON', () => {
  const result = runCli(['to-json', fullFeatured]);
  assert.strictEqual(result.code, 0);
  assert.strictEqual(result.stderr, '');

  const parsed = JSON.parse(result.stdout);
  assert.strictEqual(parsed.lists.length, 4);
  assert.deepStrictEqual(parsed.diagnostics, []);
});

test('--help exits 0 and prints usage', () => {
  const result = runCli(['--help']);
  assert.strictEqual(result.code, 0);
  assert.strictEqual(result.stderr, '');
  assert.match(result.stdout, /Usage: embridge <command> \[options\]/);
  assert.match(result.stdout, /validate <file\.\.\.>/);
});

test('help exits 0 and prints usage', () => {
  const result = runCli(['help']);
  assert.strictEqual(result.code, 0);
  assert.strictEqual(result.stderr, '');
  assert.match(result.stdout, /Usage: embridge <command> \[options\]/);
});

test('--version matches package.json', () => {
  const result = runCli(['--version']);
  assert.strictEqual(result.code, 0);
  assert.strictEqual(result.stderr, '');
  assert.strictEqual(result.stdout, `${packageJson.version}\n`);
});

test('bin/embridge.js has a node shebang and is executable', () => {
  const source = fs.readFileSync(binPath, 'utf8');
  assert(source.startsWith('#!/usr/bin/env node\n'));

  const result = spawnSync(binPath, ['--version'], { encoding: 'utf8' });
  assert.strictEqual(result.status, 0);
  assert.strictEqual(result.stderr, '');
  assert.strictEqual(result.stdout, `${packageJson.version}\n`);
});

console.log('CLI tests passed');

function test(name, fn) {
  try {
    fn();
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.stack || error.message);
    process.exit(1);
  }
}

function runCli(args) {
  const stdout = captureStream();
  const stderr = captureStream();
  const code = run(args, { stdout, stderr });

  return {
    code,
    stdout: stdout.text(),
    stderr: stderr.text(),
  };
}

function captureStream() {
  const chunks = [];
  return {
    write(chunk) {
      chunks.push(String(chunk));
    },
    text() {
      return chunks.join('');
    },
  };
}
