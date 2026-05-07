'use strict';

function warning(line, message) {
  return {
    line,
    severity: 'warning',
    message,
  };
}

module.exports = {
  warning,
};
