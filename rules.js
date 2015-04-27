'use strict';

var repeat = require('repeat-string');
var li = require('list-item')();

/**
 * Local dependencies
 */

var utils           = 'remarkable/lib/common/utils';
var has             = require(utils).has;
var unescapeMd      = require(utils).unescapeMd;
var replaceEntities = require(utils).replaceEntities;
var escapeHtml      = require(utils).escapeHtml;

/**
 * Renderer rules cache
 */

var rules = {inside: {}};

/**
 * Blockquotes
 */

rules.blockquote_open = function (tokens, idx /*, options, env */) {
  return '> ';
};

rules.blockquote_close = function (tokens, idx /*, options, env */) {
  return ''
};

/**
 * Code
 */

rules.code = function (tokens, idx /*, options, env */) {
  if (tokens[idx].block) {
    return '```' + tokens[idx].content + '```' + getBreak(tokens, idx);
  }
  return '`' + tokens[idx].content + '`';
};

/**
 * Fenced code blocks
 */

rules.fence = function (tokens, idx, options, env, self) {
  var token = tokens[idx];
  var langClass = '';
  var langPrefix = options.langPrefix;
  var langName = '', fenceName;
  var highlighted;

  if (token.params) {

    //
    // ```foo bar
    //
    // Try custom renderer "foo" first. That will simplify overwrite
    // for diagrams, latex, and any other fenced block with custom look
    //

    var i = token.params.indexOf(' ');
    if (i === -1) i = token.params.length;
    fenceName = token.params.slice(0, i);

    if (has(self.rules.fence_custom, fenceName)) {
      return self.rules.fence_custom[fenceName](tokens, idx, options, env, self);
    }
  }
  var res = '\n';
  res += '```' + fenceName + '\n';
  res += token.content.trim() + '\n';
  res += '```\n';
  res += getBreak(tokens, idx);
  return res;
};

rules.fence_custom = {};

/**
 * Headings
 */

rules.heading_open = function (tokens, idx /*, options, env */) {
  return repeat('#', tokens[idx].hLevel) + ' ';
};
rules.heading_close = function (tokens, idx /*, options, env */) {
  return '\n' + getBreak(tokens, idx);
};

/**
 * Horizontal rules
 */

rules.hr = function (tokens, idx) {
  return '***\n' + getBreak(tokens, idx);
};

/**
 * Bullets
 */

rules.bullet_list_open = function (tokens, idx/*,options, env */) {
  return '';
};
rules.bullet_list_close = function (tokens, idx /*, options, env */) {
  return getBreak(tokens, idx);
};

/**
 * List items
 */

rules.list_item_open = function (tokens, idx/*,options, env */) {
  var token = tokens[idx];
  var lvl = token.level - 1;
  return li(lvl > 0 ? (lvl / 2) : 0, '');
};
rules.list_item_close = function (tokens, idx/*,options, env */) {
  return getBreak(tokens, idx);
};

/**
 * Ordered list items
 */

rules.ordered_list_open = function (tokens, idx /*, options, env */) {
  var token = tokens[idx];
  var lvl = token.level - 1;
  return li(lvl > 0 ? (lvl / 2) : 0, '');
};
rules.ordered_list_close = function (tokens, idx /*, options, env */) {
  return getBreak(tokens, idx);
};

/**
 * Paragraphs
 */

rules.paragraph_open = function (tokens, idx /*, options, env */) {
  return tokens[idx].tight ? '' : '\n';
};
rules.paragraph_close = function (tokens, idx /*, options, env */) {
  var next = tokens[idx + 1];
  var prev = tokens[idx - 1];
  var token = tokens[idx];

  if (next && next.type.indexOf('paragraph') === -1) {
    return token.tight ? '' : '\n' + getBreak(tokens, idx);
  }
  var addBreak = !(token.tight && idx && prev.type === 'inline' && !prev.content);
  return (token.tight ? '' : '') + (addBreak ? getBreak(tokens, idx) : '');
};

/**
 * Links
 */

rules.link_open = function (tokens, idx /*, options, env */) {
  var title = tokens[idx].title ? (' title="' + replaceEntities(tokens[idx].title) + '"') : '';
  return '<a href="' + escapeHtml(tokens[idx].href) + '"' + title + '>';
};
rules.link_close = function (tokens, idx/* , options, env */) {
  return '</a>';
};

/**
 * Images
 */

rules.image = function (tokens, idx, options /*, env */) {
  var src = ' src="' + escapeHtml(tokens[idx].src) + '"';
  var title = tokens[idx].title ? (' title="' + tokens[idx].title + '"') : '';
  var alt = ' alt="' + (tokens[idx].alt ? escapeHtml(replaceEntities(tokens[idx].alt)) : '') + '"';
  var suffix = options.xhtmlOut ? ' /' : '';
  return '<img' + src + alt + title + suffix + '>';
};

/**
 * Tables
 */

rules.table_open = function (tokens, idx/* , options, env */) {
  rules.insideTable = true;
  return '';
};
rules.table_close = function (tokens, idx/* , options, env */) {
  return '\n';
};
rules.thead_open = function (tokens, idx/* , options, env */) {
  rules.inside.thead = true;
  return '';
};
rules.thead_close = function (tokens, idx/* , options, env */) {
  rules.inside.thead = false;
  return '';
};
rules.tbody_open = function (tokens, idx/* , options, env */) {
  rules.inside.tbody = true;
  return '';
};
rules.tbody_close = function (tokens, idx/* , options, env */) {
  return '';
};
rules.tr_open = function (tokens, idx/* , options, env */) {
  rules.inside.tr = true;
  var next = tokens[idx + 1];

  return '| ';
};
rules.tr_close = function (tokens, idx/* , options, env */) {
  rules.inside.tr = false;
  var next = tokens[idx + 1];
  return '\n';
};
var align = [];
rules.th_open = function (tokens, idx /*, options, env */) {
  rules.inside.th = true;
  var token = tokens[idx];
  var next = tokens[idx + 1];
  if (rules.inside.tr) {
    align.push(token.align);
  }
  return '';
};
rules.th_close = function (tokens, idx/* , options, env */) {
  rules.inside.th = false;
  var next = tokens[idx + 1];
  return ' | ';
};
rules.td_open = function (tokens, idx /*, options, env */) {
  var token = tokens[idx];
  var prev = tokens[idx - 1];
  if (prev && prev.type === 'tr_open') {
    return '';
  }
  // return token.align;
  return ' | ';
};
rules.td_close = function (tokens, idx/* , options, env */) {
  var next = tokens[idx + 1];
  var prev = tokens[idx - 1];
  if (next && next.type === 'tr_close') {
    return ' |';
  }
  return '';
};

/**
 * Bold
 */

rules.strong_open = function (tokens, idx/* , options, env */) {
  rules.inside.strong = {};
  var prev = tokens[idx - 1];
  var res = '';

  if (prev && prev.type === 'softbreak') {
    res += '\n';
  }
  rules.inside.strong.prev = prev;
  res += '**';
  return res;
};
rules.strong_close = function (tokens, idx/* , options, env */) {
  var prev = rules.inside.strong.prev;
  // if it's not a "heading", or it's inside a table heading
  if (prev && prev.type === 'text' || rules.inside.th) {
    return '**';
  }
  var res = detectBreak(tokens, idx, '**');
  rules.inside.strong = null;
  return res;
};

/**
 * Italicize
 */

rules.em_open = function (tokens, idx/* , options, env */) {
  return '_';
};
rules.em_close = function (tokens, idx/* , options, env */) {
  return detectBreak(tokens, idx, '_');
};

/**
 * Strikethrough
 */

rules.del_open = function (tokens, idx/* , options, env */) {
  return '~~';
};
rules.del_close = function (tokens, idx/* , options, env */) {
  return detectBreak(tokens, idx, '~~');
};

/**
 * Insert
 */

rules.ins_open = function (tokens, idx/* , options, env */) {
  return '<ins>';
};
rules.ins_close = function (tokens, idx/* , options, env */) {
  return '</ins>';
};

/**
 * Highlight
 */

rules.mark_open = function (tokens, idx/* , options, env */) {
  return '<mark>';
};
rules.mark_close = function (tokens, idx/* , options, env */) {
  return '</mark>';
};

/**
 * Super- and sub-script
 */

rules.sub = function (tokens, idx /*, options, env */) {
  return '<sub>' + tokens[idx].content + '</sub>';
};
rules.sup = function (tokens, idx /*, options, env */) {
  return '<sup>' + tokens[idx].content + '</sup>';
};

/**
 * Breaks
 */

rules.hardbreak = function (tokens, idx, options /*, env */) {
  return '\n\n';
};
rules.softbreak = function (tokens, idx, options /*, env */) {
  return '\n';
};

/**
 * Text
 */

rules.text = function (tokens, idx /*, options, env */) {
  return tokens[idx].content;
};

/**
 * Content
 */

rules.htmlblock = function (tokens, idx /*, options, env */) {
  return tokens[idx].content;
};
rules.htmltag = function (tokens, idx /*, options, env */) {
  return tokens[idx].content;
};

/**
 * Abbreviations, initialism
 */

rules.abbr_open = function (tokens, idx /*, options, env */) {
  return '<abbr title="' + tokens[idx].title + '">';
};
rules.abbr_close = function (tokens, idx/* , options, env */) {
  return '</abbr>';
};

/**
 * Footnotes
 */

rules.footnote_ref = function (tokens, idx) {
  var n = Number(tokens[idx].id + 1).toString();
  var id = 'fnref' + n;
  if (tokens[idx].subId > 0) {
    id += ':' + tokens[idx].subId;
  }
  return '<sup class="footnote-ref"><a href="#fn' + n + '" id="' + id + '">[' + n + ']</a></sup>';
};
rules.footnote_block_open = function (tokens, idx, options) {
  var hr = options.xhtmlOut
    ? '<hr class="footnotes-sep" />\n'
    : '<hr class="footnotes-sep">\n';
  return  hr + '<section class="footnotes">\n<ol class="footnotes-list">\n';
};
rules.footnote_block_close = function () {
  return '</ol>\n</section>\n';
};
rules.footnote_open = function (tokens, idx) {
  var id = Number(tokens[idx].id + 1).toString();
  return '<li id="fn' + id + '"  class="footnote-item">';
};
rules.footnote_close = function () {
  return '</li>\n';
};
rules.footnote_anchor = function (tokens, idx) {
  var n = Number(tokens[idx].id + 1).toString();
  var id = 'fnref' + n;
  if (tokens[idx].subId > 0) {
    id += ':' + tokens[idx].subId;
  }
  return ' <a href="#' + id + '" class="footnote-backref">↩</a>';
};

/**
 * Definition lists
 */

rules.dl_open = function() {
  return '<dl>\n';
};
rules.dt_open = function() {
  return '<dt>';
};
rules.dd_open = function() {
  return '<dd>';
};
rules.dl_close = function() {
  return '</dl>\n';
};
rules.dt_close = function() {
  return '</dt>\n';
};
rules.dd_close = function() {
  return '</dd>\n';
};

/**
 * Helper functions
 */

function nextToken(tokens, idx) {
  if (++idx >= tokens.length - 2) {
    return idx;
  }
  if ((tokens[idx].type === 'paragraph_open' && tokens[idx].tight) &&
      (tokens[idx + 1].type === 'inline' && tokens[idx + 1].content.length === 0) &&
      (tokens[idx + 2].type === 'paragraph_close' && tokens[idx + 2].tight)) {
    return nextToken(tokens, idx + 2);
  }
  return idx;
}

/**
 * Check to see if `\n` is needed before the next token.
 *
 * @param  {Array} `tokens`
 * @param  {Number} `idx`
 * @return {String} Empty string or newline
 * @api private
 */

var getBreak = rules.getBreak = function getBreak(tokens, idx) {
  idx = nextToken(tokens, idx);
  if (idx < tokens.length && tokens[idx].type === 'list_item_close') {
    return '';
  }
  return '\n';
};

function detectBreak(tokens, idx, ch) {
  var next = tokens[idx + 1];
  var after = tokens[idx + 2];
  var res = ch;
  if (!next || next.type === 'softbreak') {
    res += '\n';
  }
  return res;
}

/**
 * Expose `rules`
 */

module.exports = rules;
