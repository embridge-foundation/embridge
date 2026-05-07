'use strict';

function classifyLine(line) {
  if (/^\s*$/.test(line)) return 'blank';
  if (/^# .+/.test(line)) return 'heading';
  if (/^\s*>+/.test(line)) return 'comment';
  if (/^\s*(?:- |(?:0|[1-9]\d*)\. )/.test(line)) return 'item';
  if (/^\s*"/.test(line)) return 'description';
  if (/[A-Za-z][A-Za-z0-9-]*\s*:/.test(line)) return 'metadata';
  return 'text';
}

module.exports = {
  classifyLine,
};
