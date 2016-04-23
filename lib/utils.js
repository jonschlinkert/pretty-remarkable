'use strict';

/**
 * Module dependencies
 */

var utils = require('lazy-cache')(require);
var fn = require;
require = utils;

/**
 * Lazily required module dependencies
 */

require('list-item', 'li');
require('markdown-utils', 'mdu');
require('repeat-string', 'repeat');
require = fn;

utils.escapeRe = function(str) {
  return str.replace(/[-.?*+^$[\]\\(){}|]/g, '\\$&');
};

/**
 * Expose `utils` modules
 */

module.exports = utils;
