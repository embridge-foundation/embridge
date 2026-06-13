'use strict';

const SHORT_INLINE_FORMAT_RE = /^embridge\s+v\d+\.\d+\.\d+(?:,\s*.+)?$/i;

function extractDocumentMetadata(markdown) {
  const source = markdown.replace(/^\uFEFF/, '');
  const comments = findBoundaryHtmlComments(source);
  const skippedLines = new Set();

  if (comments.length === 0) {
    return {
      documentMetadata: null,
      skippedLines,
    };
  }

  const metadataCandidates = [];
  for (const comment of comments) {
    for (let line = comment.startLine; line <= comment.endLine; line += 1) {
      skippedLines.add(line);
    }

    const documentMetadata = parseDocumentMetadata(comment.content);
    if (documentMetadata) {
      metadataCandidates.push({
        documentMetadata,
        kind: isInlineFormatTag(comment.content) ? 'inline' : 'block',
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

function findBoundaryHtmlComments(source) {
  const lines = source.split(/\r?\n/);
  const comments = [];
  const seen = new Set();

  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s*$/.test(lines[index])) continue;

    const comment = readStandaloneHtmlCommentAt(lines, index);
    if (!comment) break;
    addComment(comments, seen, comment);
    index = comment.endIndex;
  }

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (/^\s*$/.test(lines[index])) continue;

    const comment = readStandaloneHtmlCommentEndingAt(lines, index);
    if (!comment) break;
    addComment(comments, seen, comment);
    index = comment.startIndex;
  }

  comments.sort((a, b) => a.startLine - b.startLine);
  return comments;
}

function readStandaloneHtmlCommentAt(lines, startIndex) {
  const singleLine = lines[startIndex].match(/^\s*<!--([\s\S]*?)-->\s*$/);
  if (singleLine) return toComment(singleLine[1], startIndex, startIndex);

  if (!/^\s*<!--\s*$/.test(lines[startIndex])) return null;

  const content = [];
  let index = startIndex + 1;
  while (index < lines.length && lines[index].trim() !== '-->') {
    content.push(lines[index]);
    index += 1;
  }

  return index < lines.length ? toComment(content.join('\n'), startIndex, index) : null;
}

function readStandaloneHtmlCommentEndingAt(lines, endIndex) {
  const singleLine = lines[endIndex].match(/^\s*<!--([\s\S]*?)-->\s*$/);
  if (singleLine) return toComment(singleLine[1], endIndex, endIndex);
  if (lines[endIndex].trim() !== '-->') return null;

  for (let index = endIndex - 1; index >= 0; index -= 1) {
    if (/^\s*<!--\s*$/.test(lines[index])) {
      return toComment(lines.slice(index + 1, endIndex).join('\n'), index, endIndex);
    }
  }
  return null;
}

function toComment(content, startIndex, endIndex) {
  return {
    content,
    startIndex,
    endIndex,
    startLine: startIndex + 1,
    endLine: endIndex + 1,
  };
}

function addComment(comments, seen, comment) {
  const key = `${comment.startLine}:${comment.endLine}`;
  if (seen.has(key)) return;
  seen.add(key);
  comments.push(comment);
}

function lastCandidateOfKind(candidates, kind) {
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    if (candidates[index].kind === kind) return candidates[index];
  }
  return null;
}

function isInlineFormatTag(content) {
  const trimmed = content.trim();
  return SHORT_INLINE_FORMAT_RE.test(trimmed) ||
    /^format\s*:\s*.+$/i.test(trimmed);
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
  if (SHORT_INLINE_FORMAT_RE.test(trimmed)) {
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
