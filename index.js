/*!
 * pretty-remarkable <https://github.com/jonschlinkert/pretty-remarkable>
 *
 * Copyright (c) 2014-2015, 2017, Jon Schlinkert.
 * Released under the MIT License.
 */

'use strict';

/**
 * Local dependencies
 */

var expand = require('expand-reflinks');
var rules = require('./lib/rules');

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
  var render = md.render;
  md.render = function(str, options) {
    str = expand(str, options);
    str = str.split(/\]\[\]\s*\n\s*\[/).join('][]\n\n[');
    return render.call(md, str, options);
  };

  md.renderer.renderInline = function(tokens, options, env) {
    var _rules = rules;
    var len = tokens.length, i = 0;
    var str = '';

    while (len--) {
      str += _rules[tokens[i].type](tokens, i++, options, env, this);
    }
    return str;
  };

  md.renderer.render = function(tokens, options, env) {
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

    if (options.condense !== false) {
      str = str.split(/(?:\r\n|\n){2,}/).join('\n\n');
    }

    var newline = '\n';
    if (options.newline === false) {
      newline = '';
    }
    if (typeof options.newline === 'string') {
      newline = options.newline;
    }
    str = str.trim() + newline;
    return str;
  };
}

/**
 * expose `prettify`
 */

module.exports = prettify;
module.exports.expand = expand;
