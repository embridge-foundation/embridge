'use strict';

const { parseEmbridge } = require('./parser');
const { stringifyEmbridge } = require('./markdown-writer');

module.exports = {
  parseEmbridge,
  stringifyEmbridge,
};
