'use strict';

var utils = require('./utils');

/**
 * Return true if `object` hasOwnProperty `key`
 */

var hasOwn = Object.prototype.hasOwnProperty;
function has(obj, key) {
  return obj ? hasOwn.call(obj, key) : false;
}

/**
 * Renderer rules cache
 */

var rules = {
  list: {ordered: false, num: 1},
  inside: {},
  badges: [],
  links: [],
  images: [],
  count: {
    badges: 0,
    images: 0,
    links: 0
  }
};

/**
 * Blockquotes
 */

rules.blockquote_open = function(/*tokens, idx, options, env */) {
  return '> ';
};

rules.blockquote_close = function(/*tokens, idx, options, env */) {
  return '';
};

/**
 * Code
 */

rules.code = function(tokens, idx /*, options, env */) {
  if (tokens[idx].block) {
    return '```' + tokens[idx].content + '```' + getBreak(tokens, idx);
  }
  return '`' + tokens[idx].content + '`';
};

/**
 * Fenced code blocks
 */

rules.fence = function(tokens, idx, options, env, self) {
  var token = tokens[idx], fenceName;

  if (token.params) {
    var i = token.params.indexOf(' ');
    if (i === -1) i = token.params.length;
    fenceName = token.params.slice(0, i);

    if (has(self.rules.fence_custom, fenceName)) {
      return self.rules.fence_custom[fenceName](tokens, idx, options, env, self);
    }
  }

  token.content = token.content.replace(/^\n+/, '');
  token.content = token.content.replace(/\n+$/, '');

  var res = '\n';
  res += '```' + (fenceName || '') + '\n';
  res += token.content + '\n';
  res += '```\n';
  res += getBreak(tokens, idx);
  return res;
};

rules.fence_custom = {};

/**
 * Headings
 */

rules.heading_open = function(tokens, idx /*, options, env */) {
  return utils.repeat('#', tokens[idx].hLevel) + ' ';
};
rules.heading_close = function(tokens, idx /*, options, env */) {
  return '\n' + getBreak(tokens, idx);
};

/**
 * Horizontal rules
 */

rules.hr = function(tokens, idx) {
  return '***\n' + getBreak(tokens, idx);
};

/**
 * Bullets
 */

rules.bullet_list_open = function(tokens, idx/*, options, env */) {
  rules.list.ordered = false;
  return '\n';
};
rules.bullet_list_close = function(tokens, idx /*, options, env */) {
  return getBreak(tokens, idx);
};

/**
 * Ordered list items
 */

rules.ordered_list_open = function(tokens, idx/*, options, env */) {
  rules.list.ordered = true;
  return '\n';
};
rules.ordered_list_close = function(tokens, idx /*, options, env */) {
  rules.list.ordered = false;
  rules.list.num = 1;
  return getBreak(tokens, idx);
};

/**
 * List items
 */

rules.list_item_open = function(tokens, idx, options/*, env */) {
  options = options || {};
  var token = tokens[idx];
  var next = tokens[idx + 2] || {};
  var level = lvl(token.level);

  if (next.children && next.children.length > 1) {
    for (var i = 1; i < next.children.length; i++) {
      var child = next.children[i];
      if (child.content && /^[-\w]{1,2}[.]\s/.test(child.content)) {
        var prefix = utils.repeat(' ', level + 2);
        next.children[i].content = (prefix + child.content);
        next.children[i].level = level + 2;
      }
    }
  }

  // list info
  options.chars = ['*', '-', '+'];
  if (rules.list.ordered) {
    options.chars = (rules.list.num++) + '.';
  }

  return utils.li(options)(level, '');
};

rules.list_item_close = function(tokens, idx/*,options, env */) {
  var prev = tokens[idx - 1];
  var br = getBreak(tokens, idx);
  if (prev && prev.tight) {
    return br;
  }
  return '';
};

/**
 * Paragraphs
 */

rules.paragraph_open = function(tokens, idx /*, options, env */) {
  var token = tokens[idx];
  var prev = tokens[idx - 1];
  var next = tokens[idx + 1];
  if (prev && prev.type === 'blockquote_open') {
    return '';
  }
  if (next && next.type === 'inline') {
    return '';
  }
  return token.tight ? '' : '\n';
};
rules.paragraph_close = function(tokens, idx /*, options, env */) {
  var token = tokens[idx];
  var next = tokens[idx + 1];
  var prev = tokens[idx - 1];

  if (next && next.type && next.type.indexOf('paragraph') === -1) {
    return token.tight ? '' : '\n' + getBreak(tokens, idx);
  }

  var addBreak = !(token.tight && idx && prev.type === 'inline' && !prev.content);
  return (token.tight ? '' : '\n') + (addBreak ? getBreak(tokens, idx) : '');
};

/**
 * Links
 */

rules.link_open = function(tokens, idx /*, options, env */) {
  var prev = tokens[idx - 1];
  var token = tokens[idx];
  var next = tokens[idx + 1] || {};
  var close = tokens[idx + 2] || {};
  var after = tokens[idx + 3] || {};

  if (token && token.href === '' && next && next.content) {
    token.href = '#' + next.content;
  }

  // [foo](bar){#baz} => [foo](bar#baz) to allow `bar` to expand to a full URL
  if (close.type === 'link_close' && after && after.type === 'text') {
    var str = after.content;
    var hasBrace = str.charAt(0) === '{';
    if (str && hasBrace) {
      var end = str.indexOf('}');
      var href = str.slice(1, end);
      if (prev && prev.content && /\w$/.test(prev.content)) {
        prev.content += ' ';
      }
      after.content = str.slice(end + 1);
      if (after.content && /^\w/.test(after.content)) {
        after.content = ' ' + after.content;
      }
      token.href += href;
    }
  }

  // console.log(token.href)
  var anchor = /\{([^}]+)\}/.exec(token.href);
  if (anchor && anchor[1]) {
    token.href = token.href.replace(anchor[0], anchor[1]);
  }

  if (next.type !== 'image') {
    return utils.mdu.link(next.content, token.href, token.title);
  }
  return '';
};
rules.link_close = function(tokens, idx/*, options, env */) {
  return '';
};

/**
 * Images
 */

rules.image = function(tokens, idx, options, env) {
  var token = tokens[idx];
  var prev = tokens[idx - 1] || {};
  var next = tokens[idx + 1] || {};

  if (next.type === 'text' && next.content) {
    addAnchors(next, options.context || {});
  }

  normalizeAnchors(prev, token, next, options.context || {});
  if (prev.type !== 'link_open') {
    return utils.mdu.image(token.alt, token.src, token.title);
  }
  return utils.mdu.badge(token.alt, token.src, prev.href || token.src, token.title);
};

/**
 * Tables
 */

rules.table_open = function(/*tokens, idx, options, env */) {
  rules.align = [];
  rules.inside.table = true;
  return '';
};
rules.table_close = function(/*tokens, idx, options, env */) {
  rules.inside.table = false;
  return '\n';
};

rules.thead_open = function(tokens, idx/*, options, env */) {
  rules.inside.thead = true;
  return '| ';
};
rules.thead_close = function(tokens, idx/*, options, env */) {
  rules.inside.thead = false;
  return '';
};

rules.th_open = function(tokens, idx /*, options, env */) {
  var token = tokens[idx];

  switch (token.align) {
    case 'center':
      rules.align.push(':---:');
      break;
    case 'left':
      rules.align.push(':---');
      break;
    case 'right':
      rules.align.push('---:');
      break;
    default:
      rules.align.push('---');
      break;
  }

  rules.inside.th = true;
  return '';
};
rules.th_close = function(/*tokens, idx, options, env */) {
  rules.inside.th = false;
  return ' | ';
};

rules.tbody_open = function(tokens, idx/*, options, env */) {
  rules.inside.tbody = true;
  return '| ' + rules.align.join(' | ') + ' |' + '\n';
};
rules.tbody_close = function(/*tokens, idx, options, env */) {
  return '';
};

rules.tr_open = function(tokens, idx/*, options, env */) {
  rules.inside.tr = true;
  return '';
};
rules.tr_close = function(/*tokens, idx, options, env */) {
  rules.inside.tr = false;
  return '\n';
};

rules.td_open = function(tokens, idx/*, options, env */) {
  var prev = tokens[idx - 1];
  if (prev && prev.type === 'tr_open') {
    return '| ';
  } else {
    return ' | ';
  }
};
rules.td_close = function(tokens, idx/* , options, env */) {
  var next = tokens[idx + 1];
  if (next && next.type === 'tr_close') {
    return ' |';
  }
  return '';
};

/**
 * Bold
 */

rules.strong_open = function(tokens, idx/* , options, env */) {
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
rules.strong_close = function(tokens, idx/* , options, env */) {
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

rules.em_open = function(/*tokens, idx, options, env */) {
  return '_';
};
rules.em_close = function(tokens, idx/* , options, env */) {
  return detectBreak(tokens, idx, '_');
};

/**
 * Strikethrough
 */

rules.del_open = function(/*tokens, idx, options, env */) {
  return '~~';
};
rules.del_close = function(tokens, idx/* , options, env */) {
  return detectBreak(tokens, idx, '~~');
};

/**
 * Insert
 */

rules.ins_open = function(/*tokens, idx, options, env */) {
  return '<ins>';
};
rules.ins_close = function(/*tokens, idx, options, env */) {
  return '</ins>';
};

/**
 * Highlight
 */

rules.mark_open = function(/*tokens, idx, options, env */) {
  return '<mark>';
};
rules.mark_close = function(/*tokens, idx, options, env */) {
  return '</mark>';
};

/**
 * Super- and sub-script
 */

rules.sub = function(tokens, idx /*, options, env */) {
  return '<sub>' + tokens[idx].content + '</sub>';
};
rules.sup = function(tokens, idx /*, options, env */) {
  return '<sup>' + tokens[idx].content + '</sup>';
};

/**
 * Breaks
 */

rules.hardbreak = function(/*tokens, idx, options, env */) {
  return '\n\n';
};
rules.softbreak = function(/*tokens, idx, options, env */) {
  return '\n';
};

/**
 * Text
 */

rules.text = function(tokens, idx, options, env) {
  var ctx = options.context || {};
  var token = tokens[idx];
  addAnchors(token, ctx);

  var prev = tokens[idx - 1];
  if (prev && prev.type === 'link_open') {
    return '';
  }
  return token.content;
};

/**
 * Content
 */

rules.htmlblock = function(tokens, idx /*, options, env */) {
  return tokens[idx].content;
};
rules.htmltag = function(tokens, idx /*, options, env */) {
  return tokens[idx].content;
};

/**
 * Abbreviations, initialism
 */

rules.abbr_open = function(tokens, idx /*, options, env */) {
  return '<abbr title="' + tokens[idx].title + '">';
};
rules.abbr_close = function(/*tokens, idx, options, env */) {
  return '</abbr>';
};

/**
 * Footnotes
 */

rules.footnote_ref = function(tokens, idx) {
  var n = Number(tokens[idx].id + 1).toString();
  var id = 'fnref' + n;
  if (tokens[idx].subId > 0) {
    id += ':' + tokens[idx].subId;
  }
  return '<sup class="footnote-ref"><a href="#fn' + n + '" id="' + id + '">[' + n + ']</a></sup>';
};
rules.footnote_block_open = function(tokens, idx, options) {
  var hr = options.xhtmlOut
    ? '<hr class="footnotes-sep" />\n'
    : '<hr class="footnotes-sep">\n';
  return hr + '<section class="footnotes">\n<ol class="footnotes-list">\n';
};
rules.footnote_block_close = function() {
  return '</ol>\n</section>\n';
};
rules.footnote_open = function(tokens, idx) {
  var id = Number(tokens[idx].id + 1).toString();
  return '<li id="fn' + id + '"  class="footnote-item">';
};
rules.footnote_close = function() {
  return '</li>\n';
};
rules.footnote_anchor = function(tokens, idx) {
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

function addAnchors(token, ctx) {
  var re = /(!?\[([^\]]+)\])(\[([^\]]+)\]|(?:\[\]))?(\{(#[^}]+)\})*/g;
  var match;
  var str = token.content;

  while (match = re.exec(str)) {
    var reflink = match[1];
    var text = match[2] || '';
    var colInner = match[4] || '';
    var anchor = match[5] || '';
    var inner = match[6] || '';

    var before = str;
    if (ctx.reflinks && ctx.reflinks.hasOwnProperty(text)) {
      var resolved = reflink + '(' + ctx.reflinks[text].trim() + inner + ')';

      var reStr = '(^|[^\\[]+?)\\!?' + utils.escapeRe(reflink)
        + '(?:(?:\\[' + text + '\\])|\\[\\]|(?:\\[' + colInner + '\\]))*'
        + (anchor ? utils.escapeRe(anchor) : '') + '([\\s\\S]+?|$)';

      token.content = str.replace(new RegExp(reStr), function(m, $1, $2) {
        return $1 + resolved + $2;
      });

    }

    if (str === before) {
      break;
    }
  }
}

function normalizeAnchors(prev, token, next, ctx) {
  if (!token.src) return;
  var re = /(?:([^{]+))?(\{(#[^}]+)\})/;
  var before;
  var match;

  while (match = re.exec(next.content)) {
    before = next.content;
    next.content = next.content.split(match[0]).join('');
    if (before === next.content) break;
    token.src += match[3];
  }

  while (match = re.exec(token.src)) {
    before = token.src;
    token.src = match[1] + match[3] || '';
    if (before === token.src) break;
  }
}

function detectBreak(tokens, idx, ch) {
  var next = tokens[idx + 1];
  var res = ch;
  if (!next || next.type === 'softbreak') {
    res += '\n';
  }
  return res;
}

function lvl(level) {
  if (typeof level === 'undefined') return null;
  level = level - 1;
  return level > 0 ? (level / 2) : 0;
}

/**
 * Expose `rules`
 */

module.exports = rules;
