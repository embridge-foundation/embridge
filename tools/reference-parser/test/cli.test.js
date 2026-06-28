#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { run } = require('../src/cli');
const { parseEmbridge } = require('../src');

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

test('from-json exits 0 and prints parseable Embridge Markdown', () => {
  const jsonResult = runCli(['to-json', fullFeatured]);
  assert.strictEqual(jsonResult.code, 0);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'embridge-cli-'));
  const jsonPath = path.join(tempDir, 'full-featured.json');
  fs.writeFileSync(jsonPath, jsonResult.stdout);

  const result = runCli(['from-json', jsonPath]);
  assert.strictEqual(result.code, 0);
  assert.strictEqual(result.stderr, '');
  assert.match(result.stdout, /^# Backlog/m);
  assert.match(result.stdout, /<!--\ntitle: Project Demo/);

  const parsed = parseEmbridge(result.stdout, { sourceName: 'from-json.md' });
  assert.deepStrictEqual(parsed.diagnostics, []);
  assert.strictEqual(parsed.lists.length, 4);
  assert.strictEqual(parsed.lists[0].items[0].fields.tags, 'research, backend');
  assert.strictEqual(
    parsed.lists[1].items[0].description,
    'Users report that page 2 shows\nduplicate items from page 1.\nCheck offset calculation.',
  );
});

test('from-json exits 2 for invalid JSON', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'embridge-cli-'));
  const jsonPath = path.join(tempDir, 'invalid.json');
  fs.writeFileSync(jsonPath, '{');

  const result = runCli(['from-json', jsonPath]);
  assert.strictEqual(result.code, 2);
  assert.strictEqual(result.stdout, '');
  assert.match(result.stderr, /invalid\.json:/);
});

test('--help exits 0 and prints usage', () => {
  const result = runCli(['--help']);
  assert.strictEqual(result.code, 0);
  assert.strictEqual(result.stderr, '');
  assert.match(result.stdout, /Usage: embridge <command> \[options\]/);
  assert.match(result.stdout, /validate <file\.\.\.>/);
  assert.match(result.stdout, /from-json <file\.json>/);
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
