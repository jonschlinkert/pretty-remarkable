/*!
 * prettify-markdown <https://github.com/jonschlinkert/prettify-markdown>
 *
 * Copyright (c) 2015 Jon Schlinkert.
 * Licensed under the MIT license.
 */

'use strict';

/* deps:mocha */
var assert = require('assert');
var should = require('should');
var Remarkable = require('remarkable');
var prettify = require('./');

function pretty(str, options) {
  return new Remarkable()
    .use(prettify)
    .render(str);
}

describe('prettify', function () {
  describe('newlines', function () {
    it('should strip leading newlines:', function () {
      pretty('\n\n\nb').should.equal('b');
    });

    it('should strip trailing newlines:', function () {
      pretty('b\n\n\n').should.equal('b');
    });

    it('should reduce multiple newlines down to two:', function () {
      pretty('foo\n\n\nbar').should.equal('foo\n\nbar');
      pretty('a\n\n\nb').should.equal('a\n\nb');
      pretty('a\n\n\n\n\n\n\nb').should.equal('a\n\nb');
    });

    it('should format headings to have two newlines before content:', function () {
      pretty('# foo\nbar').should.equal('# foo\n\nbar');
      pretty('## foo\n\n\nbar').should.equal('## foo\n\nbar');
    });

    it('should ensure an extra newline before and after gfm code blocks:', function () {
      var str = 'a\n```js\nvar foo = "bar";\n```\nb';
      pretty(str).should.equal('a\n\n```js\nvar foo = "bar";\n```\n\nb');
    });
  });

  describe('strong', function () {
    it('should give "section headings" headings two newlines before content:', function () {
      pretty('foo\n**foo**\nbar').should.equal('foo\n\n**foo**\n\nbar');
      pretty('foo\n\n**foo**\nbar').should.equal('foo\n\n**foo**\n\nbar');
      pretty('**foo**\nbar').should.equal('**foo**\n\nbar');
      pretty('**foo**\n\n\nbar').should.equal('**foo**\n\nbar');
    });

    it('should not reformat bolded text that is not a heading:', function () {
      pretty('a b c **foo**\nbar').should.equal('a b c **foo**\nbar');
      pretty('one **two** three\nbar').should.equal('one **two** three\nbar');
    });
  });

  describe('badges', function () {
    it('should format badges:', function () {
      var str = '[![foo](https://a.b.c.svg)](http://a.b.c)';
      pretty(str).should.equal('[![foo](https://a.b.c.svg)](http://a.b.c)');
    });
  });
});
