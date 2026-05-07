'use strict';

const STANDARD_KEYS = new Set([
  'description',
  'desc',
  'descr',
  'status',
  'prio',
  'priority',
  'tags',
  'keywords',
  'assignee',
  'owner',
  'assigned',
  'created',
  'date',
  'createddate',
  'updated',
  'modified',
  'mod',
  'due',
  'duedate',
  'id',
]);

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

function firstMetadataKey(raw) {
  const match = raw.match(/^\s*([A-Za-z][A-Za-z0-9-]*)\s*:/);
  return match ? match[1] : null;
}

function hasAnyKeyValue(raw) {
  return /[A-Za-z][A-Za-z0-9-]*\s*:/.test(raw);
}

function buildKnownKeys(customFields) {
  const keys = new Set(STANDARD_KEYS);
  for (const field of customFields || []) {
    keys.add(String(field).toLowerCase());
  }
  return keys;
}

function hasKnownKey(fields, knownKeys) {
  return Object.keys(fields).some((key) => knownKeys.has(key.toLowerCase()));
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
  STANDARD_KEYS,
  parseMetadataLine,
  parseMetadataFields,
  firstMetadataKey,
  hasAnyKeyValue,
  buildKnownKeys,
  hasKnownKey,
  descriptionFromFields,
  itemHasMetadata,
};
