var fs = require('fs');
var prettify = require('./');
var Remarkable = require('remarkable');

function read(name) {
  return fs.readFileSync('fixtures/' + name + '.md', 'utf8');
}
var md = new Remarkable();
md.use(prettify);
var result = md.render('\n\n\n# foo\n\n\nbar\n# baz');
console.log(result);
// console.log(pretty(read('example')));
// console.log(pretty(read('blockquotes')));
// console.log(pretty(read('emphasis')));
// console.log(pretty(read('table')));
