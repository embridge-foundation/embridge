'use strict';

function createDocument(documentMetadata) {
  return {
    documentMetadata: documentMetadata || null,
    lists: [],
    diagnostics: [],
  };
}

function createList(title) {
  return {
    title: title === undefined ? null : title,
    preamble: null,
    items: [],
  };
}

function createItem(title, completed, marker) {
  return {
    title,
    completed,
    marker,
    fields: {},
    description: null,
    comments: [],
    subitems: [],
  };
}

function createComment(replyDepth, author, timestamp, text) {
  return {
    replyDepth,
    author,
    timestamp,
    text,
  };
}

module.exports = {
  createDocument,
  createList,
  createItem,
  createComment,
};
