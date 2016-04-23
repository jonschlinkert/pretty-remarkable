var fs = require('fs');
var prettify = require('./');
var Remarkable = require('remarkable');

function pretty(str, options) {
  return new Remarkable(options)
    .use(prettify)
    .render(str);
}

function read(name) {
  return fs.readFileSync('test/fixtures/' + name + '.md', 'utf8');
}

// var md = new Remarkable();
// md.use(prettify);
// var result = md.render('\n\n\n# foo\n\n\nbar\n# baz');

// console.log(pretty(read('example')));
// console.log(pretty(read('blockquotes')));
// console.log(pretty(read('emphasis')));
console.log(pretty(read('links2'), {
  context: {
    reflinks: {
      ghi: 'lllll',
      abc: 'whatever',
      def: 'yeah'
    }
  }
}));

// console.log(pretty(read('table')));
