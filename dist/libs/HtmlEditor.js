'use strict';

/**
 * Created by moyu on 2017/3/28.
 */
var cheerio = require('cheerio');
var path = require('path');
var url = require('url');
var fs = require('fs');
var st = require('../helpers/string-type');

Object.defineProperty(cheerio.prototype, 'outerHTML', {
    get: function get() {
        return this.clone().wrap('<container />').parent().html();
    }
});

function HTMLEditor(html, filename) {
    this.html = html;
    this.filename = filename;
    this.__contents__ = [];
}

HTMLEditor.prototype.append = push;
HTMLEditor.prototype._generateContent = generateContent;
HTMLEditor.prototype.getComputedHTML = getComputedHTML;
HTMLEditor.prototype.getComputedPathMap = getComputedPathMap;

module.exports = HTMLEditor;

function getComputedPathMap() {
    var $ = cheerio.load(this.html, { decodeEntities: true });
    var dirName = path.dirname(this.filename);

    var pathMap = {};
    $('script').map(function (index, dom) {
        var src = $(dom).attr('src');
        if (!src || st.isUrl(src)) return;
        src = url.parse(src).pathname;
        var absolutePath = path.join(dirName, src);
        if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
            return;
        }

        pathMap[absolutePath] = src;
    });

    $('link').map(function (index, dom) {
        var src = $(dom).attr('href');
        if (!src || st.isUrl(src)) return;
        src = url.parse(src).pathname;
        var absolutePath = path.join(dirName, src);
        if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
            return;
        }

        pathMap[absolutePath] = src;
    });

    return pathMap;
}

function getComputedHTML() {
    var html = this.html;
    // const closedBodyMarketReg = /\<\s*\/\s*body\s*\>[\s\S]*$/;
    var headFirstMarketReg = /(\<\s*head\s*\>)/;
    var index = html.search(headFirstMarketReg);
    if (index >= 0) {
        index = index + RegExp.$1.length;
        html = html.slice(0, index) + this._generateContent() + html.slice(index);
    }
    return html;
}

function generate(object) {
    var content = object.content;
    var attr = object.attr || {};
    var attrText = Object.keys(attr).map(function (name) {
        return name + '="' + attr[name] + '"';
    }).join(' ');
    switch (object.type) {
        case 'jsSrc':
            return '<script type="application/javascript" src="' + content + '" ' + attrText + '></script>';
        case 'js':
            return '<script type="application/javascript" ' + attrText + '>' + content + '</script>';
        case 'cssSrc':
            return '<link rel="stylesheet" href="' + content + '" ' + attrText + '/>';
        case 'css':
            return '<style ' + attrText + '>' + content + '</style>';
    }
}

function generateContent() {
    return this.__contents__.reduce(function (a, b) {
        return a + generate(b);
    }, '');
}

function push(content) {
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "jsSrc";
    var attr = arguments[2];

    this.__contents__.push({ content: content, type: type, attr: attr });
    return this;
}