'use strict';

function stringifyEmbridge(document) {
  if (!document || typeof document !== 'object') {
    throw new Error('Expected a parser JSON object');
  }

  const lines = [];
  const lists = Array.isArray(document.lists) ? document.lists : [];
  const registry = document.documentMetadata && Array.isArray(document.documentMetadata.lists)
    ? document.documentMetadata.lists
    : [];

  for (const list of lists) {
    if (lines.length > 0 && lines[lines.length - 1] !== '') lines.push('');
    writeList(lines, list || {}, registry);
  }

  const metadataLines = formatDocumentMetadata(document.documentMetadata);
  if (metadataLines.length > 0) {
    if (lines.length > 0 && lines[lines.length - 1] !== '') lines.push('');
    lines.push('<!--', ...metadataLines, '-->');
  }

  return `${lines.join('\n')}\n`;
}

function writeList(lines, list, registry) {
  if (list.title !== null && list.title !== undefined) {
    lines.push(`# ${String(list.title)}`);
  }

  const fields = Object.assign({}, list.fields || {});
  if (
    list.id &&
    !Object.prototype.hasOwnProperty.call(fields, 'id') &&
    !registryHasList(registry, list)
  ) {
    fields.id = list.id;
  }

  writeMetadataLines(lines, '', list.description, fields);

  for (const line of list.preamble || []) {
    lines.push(String(line));
  }

  const items = Array.isArray(list.items) ? list.items : [];
  for (const item of items) writeItem(lines, item || {}, 0);
}

function writeItem(lines, item, indent) {
  const prefix = itemPrefix(item);
  lines.push(`${spaces(indent)}${prefix.full}${String(item.title || '')}`);
  writeMetadataLines(lines, spaces(indent), item.description, item.fields || {});
  writeComments(lines, item.comments || [], indent);

  const childIndent = indent + prefix.marker.length;
  const subitems = Array.isArray(item.subitems) ? item.subitems : [];
  for (const subitem of subitems) writeItem(lines, subitem || {}, childIndent);
}

function itemPrefix(item) {
  const marker = markerPrefix(item.marker);
  const checkbox = checkboxPrefix(item.completed);
  return {
    marker,
    full: `${marker}${checkbox}`,
  };
}

function markerPrefix(marker) {
  if (marker && marker.type === 'ordered') {
    const number = Number.isInteger(marker.number) && marker.number >= 0 ? marker.number : 1;
    return `${number}. `;
  }
  return '- ';
}

function checkboxPrefix(completed) {
  if (completed === true) return '[x] ';
  if (completed === false) return '[ ] ';
  return '';
}

function writeMetadataLines(lines, indent, description, fields) {
  const keys = Object.keys(fields || {});
  const hasDescriptionField = keys.some(isDescriptionKey);

  if (description !== null && description !== undefined && !hasDescriptionField) {
    const fieldText = formatFields(fields);
    const descriptionText = quoteMultilineValue(description);
    lines.push(`${indent}${fieldText ? `${descriptionText}, ${fieldText}` : descriptionText}`);
    return;
  }

  const fieldText = formatFields(fields);
  if (fieldText) lines.push(`${indent}${fieldText}`);
}

function formatFields(fields) {
  return Object.keys(fields || {})
    .map((key) => `${key}: ${formatMetadataValue(fields[key])}`)
    .join(', ');
}

function formatMetadataValue(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (needsQuotes(text)) return `"${escapeQuotedValue(text)}"`;
  return text;
}

function quoteMultilineValue(value) {
  return `"${escapeQuotedValue(String(value))}"`;
}

function needsQuotes(value) {
  return value === '' || /[,"\n]/.test(value) || /^\s|\s$/.test(value);
}

function escapeQuotedValue(value) {
  return value.replace(/"/g, '""');
}

function writeComments(lines, comments, indent) {
  for (const comment of comments || []) {
    const depth = Number.isInteger(comment.replyDepth) && comment.replyDepth > 0
      ? comment.replyDepth
      : 1;
    const marker = '>'.repeat(depth);
    const textLines = String(comment.text || '').split('\n');
    lines.push(`${spaces(indent)}${marker} ${commentPrefix(comment)}${textLines[0] || ''}`);
    for (const line of textLines.slice(1)) {
      lines.push(`${spaces(indent)}${marker} ${line}`);
    }
  }
}

function commentPrefix(comment) {
  if (comment.author && comment.timestamp) return `@${comment.author} [${comment.timestamp}]: `;
  if (comment.author) return `@${comment.author}: `;
  if (comment.timestamp) return `[${comment.timestamp}]: `;
  return '';
}

function formatDocumentMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return [];

  const lines = [];
  if (metadata.title) lines.push(`title: ${metadata.title}`);
  if (metadata.sync) lines.push(`sync: ${metadata.sync}`);
  if (metadata.uuid) lines.push(`uuid: ${metadata.uuid}`);
  if (Array.isArray(metadata.lists) && metadata.lists.length > 0) {
    lines.push(`lists: ${metadata.lists.map(formatListRegistryEntry).join(', ')}`);
  }
  if (Array.isArray(metadata.fields) && metadata.fields.length > 0) {
    lines.push(`fields: ${metadata.fields.join(', ')}`);
  }
  if (metadata.syntax && metadata.syntax.mode) {
    lines.push(`syntax: mode: ${metadata.syntax.mode}`);
  }
  if (metadata.format) lines.push(`format: ${metadata.format}`);
  return lines;
}

function formatListRegistryEntry(entry) {
  return `"${escapeQuotedValue(String(entry.title || ''))}" ${entry.id || ''}`.trim();
}

function registryHasList(registry, list) {
  return registry.some((entry) => entry.title === list.title && entry.id === list.id);
}

function isDescriptionKey(key) {
  return ['description', 'desc', 'descr'].includes(String(key || '').toLowerCase());
}

function spaces(count) {
  return ' '.repeat(count);
}

module.exports = {
  stringifyEmbridge,
};
