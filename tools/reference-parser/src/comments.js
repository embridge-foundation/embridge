'use strict';

const { createComment } = require('./ast');

function parseCommentLine(line) {
  const match = line.match(/^(\s*)(>+)\s?(.*)$/);
  if (!match) return null;

  const indent = match[1].length;
  const replyDepth = match[2].length;
  const raw = match[3].trim();

  let prefix = raw.match(/^@([^\[\s:]+)\s+\[([^\]]+)\]\s*:\s*(.*)$/);
  if (prefix) {
    return {
      indent,
      comment: createComment(replyDepth, prefix[1], prefix[2], prefix[3]),
      hasPrefix: true,
    };
  }

  prefix = raw.match(/^@([^\[\s:]+)\s*:\s*(.*)$/);
  if (prefix) {
    return {
      indent,
      comment: createComment(replyDepth, prefix[1], null, prefix[2]),
      hasPrefix: true,
    };
  }

  prefix = raw.match(/^\[([^\]]+)\]\s*:\s*(.*)$/);
  if (prefix) {
    return {
      indent,
      comment: createComment(replyDepth, null, prefix[1], prefix[2]),
      hasPrefix: true,
    };
  }

  return {
    indent,
    comment: createComment(replyDepth, null, null, raw),
    hasPrefix: false,
  };
}

function appendOrAddComment(item, parsed) {
  const previous = item.comments[item.comments.length - 1];

  if (!parsed.hasPrefix && previous && previous.replyDepth === parsed.comment.replyDepth) {
    previous.text += `\n${parsed.comment.text}`;
    return;
  }

  item.comments.push(parsed.comment);
}

module.exports = {
  parseCommentLine,
  appendOrAddComment,
};
