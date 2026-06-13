'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { parseEmbridge } = require('../src');

const root = path.resolve(__dirname, '../../..');

const RELEASE_FILES = {
  rootSpec: path.join(root, 'embridge_format_specifications_v0.2.1.md'),
  archivedSpec: path.join(root, 'versions/v0_2_1/embridge_format_specifications_v0.2.1.md'),
  rootDemo: path.join(root, 'embridge_output_demo_v0.2.1.md'),
  archivedDemo: path.join(root, 'versions/v0_2_1/embridge_output_demo_v0.2.1.md'),
  fixtureDemo: path.join(root, 'tests/fixtures/full-output-demo.md'),
};

const ROOT_SPEC_ONLY_CLARIFICATIONS = [
  '   - Only standalone HTML comments at the leading/trailing document boundaries are document metadata candidates. HTML comment syntax inside item/list metadata values or quoted descriptions remains normal body text.\n',
  [
    'Full document metadata blocks are parsed by line scanning, not by matching the first `-->`.',
    '',
    '1. Match an opening line whose trimmed contents are exactly `<!--`.',
    '2. Capture following lines as metadata content.',
    '3. Stop at the first line whose trimmed contents are exactly `-->`.',
    '',
    'A `-->` occurring mid-line inside a metadata value does not terminate the block.',
    'This line-scanning rule applies only to standalone leading/trailing HTML comments; HTML comment syntax inside item/list metadata values or quoted descriptions is not a document metadata delimiter.',
    '',
  ].join('\n'),
  'Use these regexes for fast-matching inline format tags specifically. Full document metadata blocks use the boundary line-scanning rule above.',
];

const ARCHIVED_SPEC_ONLY_CLARIFICATIONS = [
  [
    '```regex',
    '<!--\\s*([\\s\\S]*?)\\s*-->',
    '```',
    'Note: This regex matches both the full multi-line metadata block and the inline format tag.',
    '',
  ].join('\n'),
  'Use these regexes for fast-matching inline format tags specifically. The general document metadata regex above also matches inline tags.',
];

function runReleaseConsistencyChecks() {
  assert.strictEqual(
    normalizeSpec(read(RELEASE_FILES.rootSpec)),
    normalizeSpec(read(RELEASE_FILES.archivedSpec)),
    'root v0.2.1 spec and archived v0.2.1 spec drift outside the documented boundary-comment clarification',
  );

  assert.strictEqual(
    read(RELEASE_FILES.rootDemo),
    read(RELEASE_FILES.archivedDemo),
    'root v0.2.1 demo and archived v0.2.1 demo must match',
  );

  for (const demoPath of [
    RELEASE_FILES.rootDemo,
    RELEASE_FILES.archivedDemo,
    RELEASE_FILES.fixtureDemo,
  ]) {
    assertListsRegistryMatchesHeadings(demoPath);
  }
}

function assertListsRegistryMatchesHeadings(filePath) {
  const input = read(filePath);
  const parsed = parseEmbridge(input, { sourceName: path.basename(filePath) });
  const registry = parsed.documentMetadata && parsed.documentMetadata.lists;
  assert(registry, `${relative(filePath)} must include document metadata lists: entries`);

  const headings = parsed.lists.map((list) => list.title);
  const registeredTitles = registry.map((entry) => entry.title);
  assert.deepStrictEqual(
    registeredTitles,
    headings,
    `${relative(filePath)} lists: entries must match H1 headings in order`,
  );
}

function normalizeSpec(source) {
  const withoutRootClarifications = removeExactFragments(source, ROOT_SPEC_ONLY_CLARIFICATIONS);
  return removeExactFragments(withoutRootClarifications, ARCHIVED_SPEC_ONLY_CLARIFICATIONS);
}

function removeExactFragments(source, fragments) {
  let result = source;
  for (const fragment of fragments) {
    result = result.replace(fragment, '');
  }
  return result;
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function relative(filePath) {
  return path.relative(root, filePath);
}

module.exports = {
  runReleaseConsistencyChecks,
};
