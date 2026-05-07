'use strict';

function extractDocumentMetadata(markdown) {
  const source = markdown.replace(/^\uFEFF/, '');
  const matches = Array.from(source.matchAll(/<!--([\s\S]*?)-->/g));
  if (matches.length === 0) {
    return {
      documentMetadata: null,
      skippedLines: new Set(),
    };
  }

  const match = matches[matches.length - 1];
  const content = match[1];
  const startLine = lineNumberAt(source, match.index);
  const endLine = lineNumberAt(source, match.index + match[0].length - 1);
  const skippedLines = new Set();
  for (let line = startLine; line <= endLine; line += 1) {
    skippedLines.add(line);
  }

  return {
    documentMetadata: parseDocumentMetadata(content),
    skippedLines,
  };
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
