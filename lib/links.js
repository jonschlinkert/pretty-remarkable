'use strict';

module.exports = function(file) {
  // var re = /\[([^\]]+)\]\(([^)]+)\)(?:\{(#[^}]+)\})?/g;
  var re = /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]\(([^)]+)\)(?:\{(#[^}]+)\})?/g;
  var str = file.content;
  var links = [];
  var match;

  while (match = re.exec(str)) {
    var len = match[0].length;
    var idx = match.index;
    var end = idx + len;
    var start = str.slice(0, match.index);
    var after = str.slice(end);

    var token = {
      link: match[0],
      title: match[1],
      url: match[2],
      anchor: match[3] || ''
    };

    // reset index
    token.inner = new RegExp(re.source).exec(token.title);
    // console.log(token)

    var newLink = '[' + token.title + '](' + token.url + token.anchor + ')';
    str = start + newLink + after;
    token.newLink = newLink;
    links.push(token);
  }

  // console.log(links);
  file.data = file.data || {};
  file.data.links = links;
  file.content = str;
  return file;
};
