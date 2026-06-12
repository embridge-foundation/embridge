'use strict';

function extractDocumentMetadata(markdown) {
  const source = markdown.replace(/^\uFEFF/, '');
  const matches = Array.from(source.matchAll(/<!--([\s\S]*?)-->/g));
  const skippedLines = new Set();

  if (matches.length === 0) {
    return {
      documentMetadata: null,
      skippedLines,
    };
  }

  const metadataCandidates = [];
  for (const match of matches) {
    const startLine = lineNumberAt(source, match.index);
    const endLine = lineNumberAt(source, match.index + match[0].length - 1);
    for (let line = startLine; line <= endLine; line += 1) {
      skippedLines.add(line);
    }

    const documentMetadata = parseDocumentMetadata(match[1]);
    if (documentMetadata) {
      metadataCandidates.push({
        documentMetadata,
        kind: isInlineFormatTag(match[1]) ? 'inline' : 'block',
      });
    }
  }

  const blockCandidate = lastCandidateOfKind(metadataCandidates, 'block');
  const inlineCandidate = lastCandidateOfKind(metadataCandidates, 'inline');
  const selected = blockCandidate || inlineCandidate;

  return {
    documentMetadata: selected ? selected.documentMetadata : null,
    skippedLines,
  };
}

function lastCandidateOfKind(candidates, kind) {
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    if (candidates[index].kind === kind) return candidates[index];
  }
  return null;
}

function isInlineFormatTag(content) {
  const trimmed = content.trim();
  return /^embridge\s+v\d+\.\d+\.\d+$/i.test(trimmed) ||
    /^format\s*:\s*.+$/i.test(trimmed);
}

function lineNumberAt(source, offset) {
  let line = 1;
  for (let i = 0; i < offset; i += 1) {
    if (source[i] === '\n') line += 1;
  }
  return line;
}

function emptyDocumentMetadata() {
  return {
    title: null,
    sync: null,
    uuid: null,
    lists: null,
    fields: null,
    syntax: null,
    format: null,
  };
}

function parseDocumentMetadata(content) {
  const trimmed = content.trim();
  const result = emptyDocumentMetadata();
  let recognized = false;

  if (!trimmed) return null;
  if (/^embridge\s+v\d+\.\d+\.\d+$/i.test(trimmed)) {
    result.format = trimmed;
    return result;
  }

  for (const rawLine of trimmed.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(/^([A-Za-z][A-Za-z0-9-]*)\s*:\s*(.*)$/);
    if (!match) continue;

    const key = match[1].toLowerCase();
    const value = match[2].trim();

    if (key === 'title') {
      result.title = value;
      recognized = true;
    } else if (key === 'sync') {
      result.sync = value;
      recognized = true;
    } else if (key === 'uuid') {
      result.uuid = value;
      recognized = true;
    } else if (key === 'lists') {
      result.lists = parseLists(value);
      recognized = true;
    } else if (key === 'fields') {
      result.fields = parseFields(value);
      recognized = true;
    } else if (key === 'syntax') {
      result.syntax = parseSyntax(value);
      recognized = true;
    } else if (key === 'format') {
      result.format = value;
      recognized = true;
    } else if (key === 'embridge') {
      result.format = `embridge:${value}`;
      recognized = true;
    }
  }

  return recognized ? result : null;
}

function parseFields(value) {
  const fields = value.split(',').map((part) => part.trim()).filter(Boolean);
  return fields.length > 0 ? fields : null;
}

function parseSyntax(value) {
  const match = value.match(/(?:^|,\s*)mode\s*:\s*(marker|blank-lines)\s*(?:,|$)/);
  return match ? { mode: match[1] } : null;
}

function parseLists(value) {
  const lists = [];
  const re = /"((?:[^"]|"")*)"\s*([^\s,]+)/g;
  let match;
  while ((match = re.exec(value)) !== null) {
    lists.push({
      title: match[1].replace(/""/g, '"'),
      id: match[2],
    });
  }
  return lists.length > 0 ? lists : null;
}

module.exports = {
  extractDocumentMetadata,
  parseDocumentMetadata,
};
