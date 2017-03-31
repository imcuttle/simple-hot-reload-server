'use strict';

/**
 * Created by moyu on 2017/3/28.
 */

exports.isUrl = function (str) {
    str = str.trim();
    var url = require('url');
    return url.parse(str).slashes || str.startsWith('//');
};

exports.isHtml = function (str) {
    // Faster than running regex, if str starts with `<` and ends with `>`, assume it's HTML
    if (str.charAt(0) === '<' && str.charAt(str.length - 1) === '>' && str.length >= 3) return true;

    // Run the regex
    var match = quickExpr.exec(str);
    return !!(match && match[1]);
};