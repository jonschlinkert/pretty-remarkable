/*!
 * pretty-remarkable <https://github.com/jonschlinkert/pretty-remarkable>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

/**
 * Local dependencies
 */

var rules = require('./rules');

/**
 * Register as a plugin by passing `prettify` to remarkable's
 * `.use()` method.
 *
 * ```js
 * var md = new Remarkable();
 * md.use(prettify);
 * var result = md.render(str);
 * ```
 *
 * @param {Object} `options`
 * @return {String}
 */

function prettify(md) {
  md.renderer.renderInline = function (tokens, options, env) {
    var _rules = rules;
    var len = tokens.length, i = 0;
    var str = '';

    while (len--) {
      str += _rules[tokens[i].type](tokens, i++, options, env, this);
    }
    return str;
  };

  md.renderer.render = function (tokens, options, env) {
    var _rules = rules;
    var len = tokens.length, i = -1;
    var str = '';

    while (++i < len) {
      if (tokens[i].type === 'inline') {
        str += this.renderInline(tokens[i].children, options, env);
      } else {
        str += _rules[tokens[i].type](tokens, i, options, env, this);
      }
    }
    str = str.split(/(?:\r\n|\n){2,}/).join('\n\n');
    return str.trim();
  };
}

/**
 * expose `prettify`
 */

module.exports = prettify;
