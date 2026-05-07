'use strict';

function isAttachmentTitle(title) {
  const trimmed = title.trim();
  return /^\[[^\]]+\]\([^)]+\)$/.test(trimmed) || /^!\[[^\]]*\]\([^)]+\)$/.test(trimmed);
}

module.exports = {
  isAttachmentTitle,
};
