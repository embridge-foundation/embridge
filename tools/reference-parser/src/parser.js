'use strict';

const { createDocument, createList, createItem } = require('./ast');
const { warning } = require('./diagnostics');
const { extractDocumentMetadata } = require('./document-metadata');
const { parseCommentLine, appendOrAddComment } = require('./comments');
const {
  parseMetadataLine,
  firstMetadataKey,
  hasAnyKeyValue,
  buildKnownKeys,
  hasKnownKey,
  descriptionFromFields,
  itemHasMetadata,
} = require('./metadata');

function parseEmbridge(markdown, options) {
  const source = String(markdown || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const metadataInfo = extractDocumentMetadata(source);
  const document = createDocument(metadataInfo.documentMetadata);
  const customFields = metadataInfo.documentMetadata && metadataInfo.documentMetadata.fields
    ? metadataInfo.documentMetadata.fields
    : [];
  const state = createState(document, buildKnownKeys(customFields), metadataInfo.skippedLines);
  const lines = source.split('\n');
  const mode = (options && options.mode) ||
    (metadataInfo.documentMetadata && metadataInfo.documentMetadata.syntax && metadataInfo.documentMetadata.syntax.mode) ||
    'marker';

  if (mode === 'blank-lines') parseBlankLinesMode(lines, state);
  else parseMarkerMode(lines, state);

  return document;
}

function createState(document, knownKeys, skippedLines) {
  return {
    document,
    knownKeys,
    skippedLines,
    currentList: null,
    itemStack: [],
    seenItemIds: new Map(),
    sectionMetaEligible: false,
  };
}

function parseMarkerMode(lines, state) {
  for (let index = 0; index < lines.length; index += 1) {
    const lineNo = index + 1;
    if (state.skippedLines.has(lineNo)) continue;

    const line = lines[index];
    if (/^\s*$/.test(line)) {
      if (sectionMetadataTarget(state)) state.sectionMetaEligible = false;
      continue;
    }

    const heading = line.match(/^# (.+)$/);
    if (heading) {
      state.currentList = createList(heading[1].trim());
      state.document.lists.push(state.currentList);
      state.itemStack = [];
      state.sectionMetaEligible = true;
      continue;
    }

    const sectionTarget = sectionMetadataTarget(state);

    const invalid = invalidMarkerDiagnostic(line, lineNo);
    if (invalid) {
      state.sectionMetaEligible = false;
      state.document.diagnostics.push(invalid);
      continue;
    }

    const itemToken = parseMarkerItem(line);
    if (itemToken) {
      state.sectionMetaEligible = false;
      addItem(state, itemToken, lineNo);
      continue;
    }

    const parsedComment = parseCommentLine(line);
    if (parsedComment) {
      state.sectionMetaEligible = false;
      const target = findItemForIndent(state, parsedComment.indent) || mostRecentItem(state);
      if (target) appendOrAddComment(target, parsedComment);
      continue;
    }

    if (/^\s*"/.test(line)) {
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
        allowUnknownKeys: true,
        mergeFields: true,
        trackItemIds: false,
      });
      else attachMetadata(state, line.trim(), lineNo);
      continue;
    }

    if (sectionTarget) {
      state.sectionMetaEligible = false;
      state.document.diagnostics.push(warning(lineNo, 'non-conformant section metadata (not key: value metadata)'));
      continue;
    }

    if (mostRecentItem(state)) {
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
      blockOpen = false;
      continue;
    }

    const invalid = invalidMarkerDiagnostic(line, lineNo);
    if (invalid) {
      state.sectionMetaEligible = false;
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
          allowUnknownKeys: true,
          mergeFields: true,
          trackItemIds: false,
        });
        continue;
      }

      state.sectionMetaEligible = false;
      state.currentList.preamble.push(line.trim());
      continue;
    }

    const parsedComment = parseCommentLine(line);
    if (parsedComment) {
      if (!blockOpen) {
        state.document.diagnostics.push(warning(lineNo, 'orphaned comment after blank-line boundary with no parent item in current block'));
        continue;
      }
      const target = findItemForIndent(state, parsedComment.indent) || mostRecentItem(state);
      if (target) appendOrAddComment(target, parsedComment);
      continue;
    }

    if (/^\s*"/.test(line)) {
      if (!blockOpen) continue;
      const result = readDescription(lines, index, state.skippedLines);
      index = result.endIndex;
      attachDescription(state, result, lineNo);
      continue;
    }

    if (hasAnyKeyValue(line) && blockOpen) {
      attachMetadata(state, line.trim(), lineNo);
      continue;
    }

    const blankItem = parseBlankLineItem(line);
    addItem(state, blankItem, lineNo);
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
  const marker = numberText === null
    ? { type: 'bullet' }
    : { type: 'ordered', number: Number(numberText) };
  const completed = parseCheckbox(match[3]);
  const title = match[4].trim();

  return { indent, marker, completed, title };
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

  if (token.indent % 2 === 1) {
    state.document.diagnostics.push(warning(lineNo, `odd indentation (${token.indent} space${token.indent === 1 ? '' : 's'}); SHOULD be multiples of 2`));
  }

  const item = createItem(token.title, token.completed, token.marker);

  while (state.itemStack.length > 0 && state.itemStack[state.itemStack.length - 1].indent >= token.indent) {
    state.itemStack.pop();
  }

  if (state.itemStack.length === 0) {
    state.currentList.items.push(item);
  } else {
    state.itemStack[state.itemStack.length - 1].item.subitems.push(item);
  }

  state.itemStack.push({ item, indent: token.indent });
}

function attachMetadata(state, raw, lineNo) {
  const item = mostRecentItem(state);
  if (!item) return;

  if (itemHasMetadata(item)) {
    state.document.diagnostics.push(warning(lineNo, 'additional metadata line ignored'));
    return;
  }

  applyMetadata(state, item, raw, lineNo, { trackItemIds: true });
}

function attachDescription(state, result, lineNo) {
  const item = mostRecentItem(state);
  if (!item) return;

  if (itemHasMetadata(item)) {
    state.document.diagnostics.push(warning(lineNo, 'additional metadata line ignored'));
    return;
  }

  applyDescription(state, item, result, lineNo, { trackItemIds: true });
}

// Shared by item and section (list) targets. Section metadata may preserve
// unknown fields; tooling SHOULD normalize canonical fields into document metadata.
function applyMetadata(state, target, raw, lineNo, options) {
  const result = parseMetadataLine(raw);
  const fields = result.fields;
  if (Object.keys(fields).length === 0) {
    state.document.diagnostics.push(warning(lineNo, 'non-conformant free-form text (not key: value metadata)'));
    return;
  }

  if (!(options && options.allowUnknownKeys) && !hasKnownKey(fields, state.knownKeys)) {
    const key = firstMetadataKey(raw);
    if (key) {
      state.document.diagnostics.push(warning(lineNo, `non-conformant free-form text ('${key.toLowerCase()}' is not a known key)`));
    } else {
      state.document.diagnostics.push(warning(lineNo, 'non-conformant free-form text (not key: value metadata)'));
    }
    return;
  }

  assignFields(target, fields, options);
  const description = descriptionFromFields(fields);
  if (description !== null) target.description = description;
  if (options && options.trackItemIds) recordDuplicateItemId(state, fields, lineNo);
  recordUnparsedMetadataTail(state, result, lineNo);
}

function applyDescription(state, target, result, lineNo, options) {
  target.description = result.value;
  if (result.trailingMeta) {
    const metadata = parseMetadataLine(result.trailingMeta);
    const fields = metadata.fields;
    if (Object.keys(fields).length > 0) assignFields(target, fields, options);
    if (options && options.trackItemIds) recordDuplicateItemId(state, fields, lineNo);
    recordUnparsedMetadataTail(state, metadata, lineNo);
  }
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

function recordDuplicateItemId(state, fields, lineNo) {
  for (const key of Object.keys(fields)) {
    if (key.toLowerCase() !== 'id') continue;
    const id = fields[key];
    if (!id) continue;
    if (state.seenItemIds.has(id)) {
      state.document.diagnostics.push(warning(lineNo, `duplicate item id '${id}'`));
    } else {
      state.seenItemIds.set(id, lineNo);
    }
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

function findItemForIndent(state, indent) {
  for (let i = state.itemStack.length - 1; i >= 0; i -= 1) {
    if (state.itemStack[i].indent === indent) return state.itemStack[i].item;
  }
  return null;
}

module.exports = {
  parseEmbridge,
};
