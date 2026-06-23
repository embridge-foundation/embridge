'use strict';

const { createDocument, createList, createItem } = require('./ast');
const { warning } = require('./diagnostics');
const { extractDocumentMetadata } = require('./document-metadata');
const { parseCommentLine, appendOrAddComment } = require('./comments');
const {
  parseMetadataLine,
  hasAnyKeyValue,
  descriptionFromFields,
  isDescriptionKey,
} = require('./metadata');

function parseEmbridge(markdown, options) {
  const source = String(markdown || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const metadataInfo = extractDocumentMetadata(source);
  const document = createDocument(metadataInfo.documentMetadata);
  const state = createState(document, metadataInfo.skippedLines);
  const lines = source.split('\n');
  const mode = (options && options.mode) ||
    (metadataInfo.documentMetadata && metadataInfo.documentMetadata.syntax && metadataInfo.documentMetadata.syntax.mode) ||
    'marker';

  if (mode === 'blank-lines') parseBlankLinesMode(lines, state);
  else parseMarkerMode(lines, state);

  resolveListRegistry(document);

  return document;
}

function resolveListRegistry(document) {
  const registry = document.documentMetadata && document.documentMetadata.lists;
  if (!registry || registry.length === 0) return;

  const entriesByTitle = groupByTitle(registry);
  const listsByTitle = groupByTitle(document.lists);

  for (const [title, lists] of listsByTitle.entries()) {
    if (title === null) continue;
    const entries = entriesByTitle.get(title);
    if (!entries || entries.length === 0) {
      applyInlineListIds(lists);
      continue;
    }

    const pairCount = Math.min(entries.length, lists.length);
    for (let index = 0; index < pairCount; index += 1) {
      lists[index].id = entries[index].id;
    }

    for (let index = pairCount; index < lists.length; index += 1) {
      applyInlineListId(lists[index]);
    }
  }
}

function groupByTitle(values) {
  const groups = new Map();
  for (const value of values) {
    const title = value.title;
    if (!groups.has(title)) groups.set(title, []);
    groups.get(title).push(value);
  }
  return groups;
}

function applyInlineListIds(lists) {
  for (const list of lists) applyInlineListId(list);
}

function applyInlineListId(list) {
  if (list.fields && Object.prototype.hasOwnProperty.call(list.fields, 'id')) {
    list.id = list.fields.id;
  }
}

function createState(document, skippedLines) {
  return {
    document,
    skippedLines,
    currentList: null,
    itemStack: [],
    seenItemIds: new Map(),
    itemIds: new WeakMap(),
    sectionMetaEligible: false,
    itemMetaEligible: false,
  };
}

function parseMarkerMode(lines, state) {
  for (let index = 0; index < lines.length; index += 1) {
    const lineNo = index + 1;
    if (state.skippedLines.has(lineNo)) continue;

    const line = lines[index];
    if (/^\s*$/.test(line)) {
      if (sectionMetadataTarget(state)) state.sectionMetaEligible = false;
      state.itemMetaEligible = false;
      continue;
    }

    const heading = line.match(/^# (.+)$/);
    if (heading) {
      state.currentList = createList(heading[1].trim());
      state.document.lists.push(state.currentList);
      state.itemStack = [];
      state.sectionMetaEligible = true;
      state.itemMetaEligible = false;
      continue;
    }

    const sectionTarget = sectionMetadataTarget(state);

    const invalid = invalidMarkerDiagnostic(line, lineNo);
    if (invalid) {
      state.sectionMetaEligible = false;
      state.itemMetaEligible = false;
      state.document.diagnostics.push(invalid);
      continue;
    }

    const itemToken = parseMarkerItem(line);
    if (itemToken) {
      state.sectionMetaEligible = false;
      addItem(state, itemToken, lineNo);
      state.itemMetaEligible = true;
      continue;
    }

    const parsedComment = parseCommentLine(line);
    if (parsedComment) {
      state.sectionMetaEligible = false;
      state.itemMetaEligible = false;
      const target = findItemForIndent(state, parsedComment.indent) || mostRecentItem(state);
      if (target) appendOrAddComment(target, parsedComment);
      continue;
    }

    if (/^\s*"/.test(line)) {
      if (!sectionTarget && !state.itemMetaEligible) {
        warnNonConformantMetadataLikeLine(state, lineNo);
        continue;
      }
      const result = readDescription(lines, index, state.skippedLines);
      index = result.endIndex;
      if (sectionTarget) applyDescription(state, sectionTarget, result, lineNo, {
        mergeFields: true,
        trackItemIds: false,
      });
      else attachDescription(state, result, lineNo);
      continue;
    }

    if (hasAnyKeyValue(line)) {
      if (sectionTarget) applyMetadata(state, sectionTarget, line.trim(), lineNo, {
        mergeFields: true,
        trackItemIds: false,
      });
      else if (state.itemMetaEligible) attachMetadata(state, line.trim(), lineNo);
      else warnNonConformantMetadataLikeLine(state, lineNo);
      continue;
    }

    if (sectionTarget) {
      state.sectionMetaEligible = false;
      state.document.diagnostics.push(warning(lineNo, 'non-conformant section metadata (not key: value metadata)'));
      continue;
    }

    if (mostRecentItem(state)) {
      state.itemMetaEligible = false;
      state.document.diagnostics.push(warning(lineNo, 'non-conformant free-form text (not key: value metadata)'));
    }
  }
}

function parseBlankLinesMode(lines, state) {
  let inPreamble = false;
  let blockOpen = false;

  for (let index = 0; index < lines.length; index += 1) {
    const lineNo = index + 1;
    if (state.skippedLines.has(lineNo)) continue;

    const line = lines[index];
    if (/^\s*$/.test(line)) {
      blockOpen = false;
      state.sectionMetaEligible = false;
      state.itemMetaEligible = false;
      if (inPreamble) {
        if (state.currentList && state.currentList.preamble && state.currentList.preamble.length === 0) {
          state.currentList.preamble = null;
        }
        inPreamble = false;
      }
      continue;
    }

    const heading = line.match(/^# (.+)$/);
    if (heading) {
      state.currentList = createList(heading[1].trim());
      state.currentList.preamble = [];
      state.document.lists.push(state.currentList);
      state.itemStack = [];
      inPreamble = true;
      state.sectionMetaEligible = true;
      state.itemMetaEligible = false;
      blockOpen = false;
      continue;
    }

    const invalid = invalidMarkerDiagnostic(line, lineNo);
    if (invalid) {
      state.sectionMetaEligible = false;
      state.itemMetaEligible = false;
      state.document.diagnostics.push(invalid);
      continue;
    }

    const itemToken = parseMarkerItem(line);
    if (itemToken) {
      state.sectionMetaEligible = false;
      if (inPreamble) {
        if (state.currentList && state.currentList.preamble && state.currentList.preamble.length === 0) {
          state.currentList.preamble = null;
        }
        inPreamble = false;
      }
      addItem(state, itemToken, lineNo);
      state.itemMetaEligible = true;
      blockOpen = true;
      continue;
    }

    if (inPreamble && state.currentList && state.currentList.items.length === 0) {
      if (state.sectionMetaEligible && /^\s*"/.test(line)) {
        const result = readDescription(lines, index, state.skippedLines);
        index = result.endIndex;
        applyDescription(state, state.currentList, result, lineNo, {
          mergeFields: true,
          trackItemIds: false,
        });
        continue;
      }

      if (state.sectionMetaEligible && hasAnyKeyValue(line)) {
        applyMetadata(state, state.currentList, line.trim(), lineNo, {
          mergeFields: true,
          trackItemIds: false,
        });
        continue;
      }

      state.sectionMetaEligible = false;
      state.itemMetaEligible = false;
      state.currentList.preamble.push(line.trim());
      continue;
    }

    const parsedComment = parseCommentLine(line);
    if (parsedComment) {
      if (!blockOpen) {
        state.document.diagnostics.push(warning(lineNo, 'orphaned comment after blank-line boundary with no parent item in current block'));
        continue;
      }
      state.itemMetaEligible = false;
      const target = findItemForIndent(state, parsedComment.indent) || mostRecentItem(state);
      if (target) appendOrAddComment(target, parsedComment);
      continue;
    }

    if (/^\s*"/.test(line)) {
      if (!blockOpen) continue;
      if (!state.itemMetaEligible) {
        warnNonConformantMetadataLikeLine(state, lineNo);
        continue;
      }
      const result = readDescription(lines, index, state.skippedLines);
      index = result.endIndex;
      attachDescription(state, result, lineNo);
      continue;
    }

    if (hasAnyKeyValue(line) && blockOpen) {
      if (state.itemMetaEligible) attachMetadata(state, line.trim(), lineNo);
      else warnNonConformantMetadataLikeLine(state, lineNo);
      continue;
    }

    const blankItem = parseBlankLineItem(line);
    addItem(state, blankItem, lineNo);
    state.itemMetaEligible = true;
    blockOpen = true;
  }

  if (state.currentList && state.currentList.preamble && state.currentList.preamble.length === 0) {
    state.currentList.preamble = null;
  }
}

function parseMarkerItem(line) {
  const match = line.match(/^(\s*)(?:- |((?:0|[1-9]\d*)\.) )(\[[ xX]\] )?(.*)$/);
  if (!match) return null;

  const indent = match[1].length;
  const numberText = match[2] ? match[2].slice(0, -1) : null;
  const markerWidth = match[2] ? match[2].length + 1 : 2;
  const marker = numberText === null
    ? { type: 'bullet' }
    : { type: 'ordered', number: Number(numberText) };
  const completed = parseCheckbox(match[3]);
  const title = match[4].trim();

  return { indent, marker, markerWidth, completed, title };
}

function parseBlankLineItem(line) {
  const indent = (line.match(/^\s*/) || [''])[0].length;
  let title = line.trim();
  let completed = null;

  const checkbox = title.match(/^\[([ xX])\]\s+(.*)$/);
  if (checkbox) {
    completed = checkbox[1] === 'x' || checkbox[1] === 'X';
    title = checkbox[2].trim();
  }

  return {
    indent,
    marker: { type: 'none' },
    markerWidth: null,
    completed,
    title,
  };
}

function parseCheckbox(raw) {
  if (!raw) return null;
  if (raw === '[ ] ') return false;
  return true;
}

function invalidMarkerDiagnostic(line, lineNo) {
  const leadingZero = line.match(/^\s*(0\d+)\. /);
  if (leadingZero) {
    return warning(lineNo, `'${leadingZero[1]}.' has leading zeros and is not recognized as an ordered marker`);
  }

  const dashNoSpace = line.match(/^\s*(-(?:\S|[^\S ]).*)/);
  if (dashNoSpace) {
    return warning(lineNo, `'${dashNoSpace[1]}' is not a valid item (space required after marker)`);
  }

  const orderedNoSpace = line.match(/^\s*(\d+\.(?:\S|[^\S ]).*)/);
  if (orderedNoSpace) {
    return warning(lineNo, `'${orderedNoSpace[1]}' is not a valid item (space required after marker)`);
  }

  return null;
}

function addItem(state, token, lineNo) {
  ensureList(state);

  const item = createItem(token.title, token.completed, token.marker);

  while (state.itemStack.length > 0 && state.itemStack[state.itemStack.length - 1].indent >= token.indent) {
    state.itemStack.pop();
  }

  if (state.itemStack.length === 0) {
    state.currentList.items.push(item);
  } else {
    const parent = state.itemStack[state.itemStack.length - 1];
    warnForNonCanonicalIndent(state, token, parent, lineNo);
    parent.item.subitems.push(item);
  }

  state.itemStack.push({ item, indent: token.indent, markerWidth: token.markerWidth });
}

function warnForNonCanonicalIndent(state, token, parent, lineNo) {
  if (parent.markerWidth === null) return;

  const canonicalIndent = parent.indent + parent.markerWidth;
  if (token.indent === canonicalIndent) return;

  state.document.diagnostics.push(warning(
    lineNo,
    `non-canonical indentation (${token.indent} space${token.indent === 1 ? '' : 's'}); child SHOULD align to parent content column (${canonicalIndent} spaces)`,
  ));
}

function attachMetadata(state, raw, lineNo) {
  const item = mostRecentItem(state);
  if (!item) return;

  applyMetadata(state, item, raw, lineNo, { mergeFields: true, trackItemIds: true });
}

function attachDescription(state, result, lineNo) {
  const item = mostRecentItem(state);
  if (!item) return;

  applyDescription(state, item, result, lineNo, { mergeFields: true, trackItemIds: true });
}

// Shared by item and section (list) targets. Unknown fields are preserved for
// forward compatibility; tooling SHOULD normalize canonical list fields into
// document metadata.
function applyMetadata(state, target, raw, lineNo, options) {
  const result = parseMetadataLine(raw);
  const fields = result.fields;
  if (Object.keys(fields).length === 0) {
    state.document.diagnostics.push(warning(lineNo, 'non-conformant free-form text (not key: value metadata)'));
    return;
  }

  recordRepeatedMetadataFields(state, target, fields, result.repeatedKeys, lineNo);
  assignFields(target, fields, options);
  const description = descriptionFromFields(fields);
  if (description !== null) target.description = description;
  if (options && options.trackItemIds) recordDuplicateItemId(state, target, fields, lineNo);
  recordUnparsedMetadataTail(state, result, lineNo);
}

function applyDescription(state, target, result, lineNo, options) {
  if (target.description != null) {
    state.document.diagnostics.push(warning(lineNo, "repeated metadata field 'description'"));
  }
  target.description = result.value;
  if (result.trailingMeta) {
    const metadata = parseMetadataLine(result.trailingMeta);
    const fields = metadata.fields;
    recordRepeatedMetadataFields(state, target, fields, metadata.repeatedKeys, lineNo);
    if (Object.keys(fields).length > 0) assignFields(target, fields, options);
    if (options && options.trackItemIds) recordDuplicateItemId(state, target, fields, lineNo);
    recordUnparsedMetadataTail(state, metadata, lineNo);
  }
}

function recordRepeatedMetadataFields(state, target, fields, repeatedKeys, lineNo) {
  const warned = new Set();
  for (const key of repeatedKeys || []) warnRepeatedMetadataField(state, warned, key, lineNo);

  for (const key of Object.keys(fields)) {
    if (Object.prototype.hasOwnProperty.call(target.fields || {}, key)) {
      warnRepeatedMetadataField(state, warned, key, lineNo);
      continue;
    }

    if (isDescriptionKey(key) && target.description != null) {
      warnRepeatedMetadataField(state, warned, 'description', lineNo);
    }
  }
}

function warnRepeatedMetadataField(state, warned, key, lineNo) {
  if (warned.has(key)) return;
  warned.add(key);
  state.document.diagnostics.push(warning(lineNo, `repeated metadata field '${key}'`));
}

function assignFields(target, fields, options) {
  if (options && options.mergeFields) {
    target.fields = Object.assign({}, target.fields || {}, fields);
  } else {
    target.fields = fields;
  }
}

function readDescription(lines, startIndex, skippedLines) {
  let lineIndex = startIndex;
  let line = lines[lineIndex];
  let pos = line.indexOf('"') + 1;
  let value = '';

  while (lineIndex < lines.length) {
    if (skippedLines.has(lineIndex + 1)) break;
    line = lines[lineIndex];

    while (pos < line.length) {
      const ch = line[pos];
      if (ch === '"' && line[pos + 1] === '"') {
        value += '"';
        pos += 2;
      } else if (ch === '"') {
        const trailing = line.slice(pos + 1).trim();
        return {
          value,
          trailingMeta: trailing.replace(/^,\s*/, '') || null,
          endIndex: lineIndex,
        };
      } else {
        value += ch;
        pos += 1;
      }
    }

    lineIndex += 1;
    if (lineIndex < lines.length && !skippedLines.has(lineIndex + 1)) {
      value += '\n';
      pos = 0;
    }
  }

  return {
    value,
    trailingMeta: null,
    endIndex: Math.max(startIndex, lineIndex - 1),
  };
}

function recordDuplicateItemId(state, item, fields, lineNo) {
  for (const key of Object.keys(fields)) {
    if (key.toLowerCase() !== 'id') continue;
    const id = fields[key];
    if (!id) continue;

    const previousId = state.itemIds.get(item);
    if (previousId && state.seenItemIds.get(previousId) === item) {
      state.seenItemIds.delete(previousId);
    }

    const existingItem = state.seenItemIds.get(id);
    if (existingItem && existingItem !== item) {
      state.document.diagnostics.push(warning(lineNo, `duplicate item id '${id}'`));
    } else {
      state.seenItemIds.set(id, item);
    }
    state.itemIds.set(item, id);
  }
}

function recordUnparsedMetadataTail(state, result, lineNo) {
  if (!result.unparsedTail) return;
  state.document.diagnostics.push(warning(
    lineNo,
    `metadata text after comma ignored; quote values containing commas ('${result.unparsedTail}')`,
  ));
}

function ensureList(state) {
  if (!state.currentList) {
    state.currentList = createList(null);
    state.document.lists.push(state.currentList);
  }
}

function mostRecentItem(state) {
  return state.itemStack.length > 0 ? state.itemStack[state.itemStack.length - 1].item : null;
}

function sectionMetadataTarget(state) {
  return (state.sectionMetaEligible && state.currentList && !mostRecentItem(state))
    ? state.currentList
    : null;
}

function warnNonConformantMetadataLikeLine(state, lineNo) {
  state.document.diagnostics.push(warning(
    lineNo,
    'metadata-like line appears after metadata eligibility closed',
  ));
}

function findItemForIndent(state, indent) {
  for (let i = state.itemStack.length - 1; i >= 0; i -= 1) {
    if (state.itemStack[i].indent === indent) return state.itemStack[i].item;
  }
  return null;
}

module.exports = {
  parseEmbridge,
};
