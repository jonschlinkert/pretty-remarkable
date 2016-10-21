'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var Remarkable = require('remarkable');
var prettify = require('..');
var expand = prettify.expand;

/**
 * test utils
 */

function pretty(str, options) {
  return new Remarkable(options)
    .use(prettify)
    .render(str);
}
function fixture(name) {
  return read('fixtures', name);
}
function expected(name) {
  return read('expected', name);
}
function read(filepath) {
  return fs.readFileSync(path.join(__dirname, filepath), 'utf8');
}

/**
 * tests
 */

describe('expand-reflinks', function() {
  describe('reflinks', function() {
    it('should not mistake links for reflinks', function() {
      assert.equal(expand(read('fixtures/list.md')), read('expected/list.md'));
    });

    it('should expand variables in reflinks', function() {
      assert.equal(expand(read('fixtures/reflinks.expand.md')), read('expected/reflinks.expand.md'));
    });

    it('should expand multiple variables reflinks', function() {
      assert.equal(expand(read('fixtures/path.md')), read('expected/path.md'));
    });
  });
});
