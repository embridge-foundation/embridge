'use strict';

const DESCRIPTION_KEYS = new Set(['description', 'desc', 'descr']);

function parseMetadataFields(raw) {
  return parseMetadataLine(raw).fields;
}

function parseMetadataLine(raw) {
  const fields = {};
  let i = 0;
  let unparsedTail = null;

  while (i < raw.length) {
    while (i < raw.length && /[\s,]/.test(raw[i])) i += 1;
    if (i >= raw.length) break;

    const keyMatch = raw.slice(i).match(/^([A-Za-z][A-Za-z0-9-]*)\s*:\s*/);
    if (!keyMatch) {
      unparsedTail = raw.slice(i).trim();
      break;
    }

    const key = keyMatch[1];
    i += keyMatch[0].length;

    let value = '';
    if (raw[i] === '"') {
      i += 1;
      while (i < raw.length) {
        if (raw[i] === '"' && raw[i + 1] === '"') {
          value += '"';
          i += 2;
        } else if (raw[i] === '"') {
          i += 1;
          break;
        } else {
          value += raw[i];
          i += 1;
        }
      }
      while (i < raw.length && raw[i] !== ',') i += 1;
    } else {
      const start = i;
      while (i < raw.length && raw[i] !== ',') i += 1;
      value = raw.slice(start, i).trim();
    }

    fields[key] = value;
    if (raw[i] === ',') i += 1;
  }

  return { fields, unparsedTail };
}

function hasAnyKeyValue(raw) {
  return /[A-Za-z][A-Za-z0-9-]*\s*:/.test(raw);
}

function descriptionFromFields(fields) {
  for (const key of Object.keys(fields)) {
    if (DESCRIPTION_KEYS.has(key.toLowerCase())) return fields[key];
  }
  return null;
}

function itemHasMetadata(item) {
  return item.description !== null || Object.keys(item.fields).length > 0;
}

module.exports = {
  parseMetadataLine,
  parseMetadataFields,
  hasAnyKeyValue,
  descriptionFromFields,
  itemHasMetadata,
};
