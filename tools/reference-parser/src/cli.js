'use strict';

const fs = require('fs');
const path = require('path');
const { parseEmbridge, stringifyEmbridge } = require('./index');

function main(args, options = {}) {
  const code = run(args, options);
  if (!options.noExit) process.exitCode = code;
  return code;
}

function run(args, options = {}) {
  const stdout = options.stdout || process.stdout;
  const stderr = options.stderr || process.stderr;

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    write(stdout, helpText());
    return 0;
  }

  if (args[0] === '--version' || args[0] === '-v') {
    write(stdout, `${readPackageVersion()}\n`);
    return 0;
  }

  if (args[0] === 'validate') {
    return validate(args.slice(1), stderr);
  }

  if (args[0] === 'to-json') {
    return toJson(args.slice(1), stdout, stderr);
  }

  if (args[0] === 'from-json') {
    return fromJson(args.slice(1), stdout, stderr);
  }

  write(stderr, `Unknown command: ${args[0]}\n\n${usageText()}\n`);
  return 2;
}

function validate(files, stderr) {
  if (files.length === 0) {
    write(stderr, `Missing file path.\n\n${usageText()}\n`);
    return 2;
  }

  let hasDiagnostics = false;

  for (const file of files) {
    let input;
    try {
      input = fs.readFileSync(file, 'utf8');
    } catch (error) {
      write(stderr, `${file}: ${error.message}\n`);
      return 2;
    }

    let result;
    try {
      result = parseEmbridge(input, { sourceName: file });
    } catch (error) {
      write(stderr, `${file}: ${error.message}\n`);
      return 2;
    }

    for (const diagnostic of result.diagnostics || []) {
      hasDiagnostics = true;
      write(stderr, formatDiagnostic(file, diagnostic));
    }
  }

  return hasDiagnostics ? 1 : 0;
}

function toJson(files, stdout, stderr) {
  if (files.length !== 1) {
    write(stderr, `Expected exactly one file path.\n\n${usageText()}\n`);
    return 2;
  }

  const file = files[0];
  let input;
  try {
    input = fs.readFileSync(file, 'utf8');
  } catch (error) {
    write(stderr, `${file}: ${error.message}\n`);
    return 2;
  }

  let result;
  try {
    result = parseEmbridge(input, { sourceName: file });
  } catch (error) {
    write(stderr, `${file}: ${error.message}\n`);
    return 2;
  }

  write(stdout, `${JSON.stringify(result, null, 2)}\n`);
  return 0;
}

function fromJson(files, stdout, stderr) {
  if (files.length !== 1) {
    write(stderr, `Expected exactly one file path.\n\n${usageText()}\n`);
    return 2;
  }

  const file = files[0];
  let input;
  try {
    input = fs.readFileSync(file, 'utf8');
  } catch (error) {
    write(stderr, `${file}: ${error.message}\n`);
    return 2;
  }

  let result;
  try {
    result = JSON.parse(input);
  } catch (error) {
    write(stderr, `${file}: ${error.message}\n`);
    return 2;
  }

  try {
    write(stdout, stringifyEmbridge(result));
  } catch (error) {
    write(stderr, `${file}: ${error.message}\n`);
    return 2;
  }

  return 0;
}

function formatDiagnostic(file, diagnostic) {
  const location = diagnostic.line ? `${file}:${diagnostic.line}` : file;
  const severity = diagnostic.severity || 'warning';
  const message = diagnostic.message || 'diagnostic';
  return `${location}: ${severity}: ${message}\n`;
}

function readPackageVersion() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')).version;
}

function helpText() {
  return [
    usageText(),
    '',
    'Commands:',
    '  validate <file...>     Validate Embridge Markdown files',
    '  to-json <file.md>      Parse an Embridge Markdown file as JSON',
    '  from-json <file.json>  Convert parser JSON back to Embridge Markdown',
    '',
    'Options:',
    '  -h, --help          Show this help',
    '  -v, --version       Show the package version',
    '',
  ].join('\n');
}

function usageText() {
  return 'Usage: embridge <command> [options]';
}

function write(stream, text) {
  stream.write(text);
}

module.exports = {
  main,
  run,
  fromJson,
  toJson,
  validate,
};
