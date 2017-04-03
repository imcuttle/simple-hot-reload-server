/**
 * Created by moyu on 2017/3/28.
 */
const cheerio = require('cheerio');
const path = require('path');
const url = require('url');
const fs = require('fs');
const st = require('../helpers/string-type');

Object.defineProperty(cheerio.prototype, 'outerHTML', {
    get: function () {
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

module.exports  = HTMLEditor;

function getComputedPathMap() {
    const $ = cheerio.load(this.html, {decodeEntities: true});
    let dirName = path.dirname(this.filename);

    const pathMap = {};
    $('script').map((index, dom) => {
        let src = $(dom).attr('src');
        if (!src || st.isUrl(src)) return;
        src = url.parse(src).pathname;
        let absolutePath = path.join(dirName, src);
        if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
            return;
        }

        pathMap[absolutePath] = src;
    });

    $('link').map((index, dom) => {
        let src = $(dom).attr('href');
        if (!src || st.isUrl(src)) return;
        src = url.parse(src).pathname;
        let absolutePath = path.join(dirName, src);
        if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
            return;
        }

        pathMap[absolutePath] = src;
    });

    return pathMap;
}

function getComputedHTML() {
    let html = this.html;
    // const closedBodyMarketReg = /\<\s*\/\s*body\s*\>[\s\S]*$/;
    const headFirstMarketReg = /(\<\s*head\s*\>)/;
    let index = html.search(headFirstMarketReg);
    if (index >= 0) {
        index = index+RegExp.$1.length;
        html = html.slice(0, index)
            + this._generateContent()
            + html.slice(index);
    }
    return html;
}

function generate(object) {
    const content = object.content;
    const attr = object.attr || {};
    const attrText = Object.keys(attr).map(name => name+'="'+attr[name]+'"').join(' ');
    switch (object.type) {
        case 'jsSrc':
            return `<script type="application/javascript" src="${content}" ${attrText}></script>`
        case 'js':
            return `<script type="application/javascript" ${attrText}>${content}</script>`
        case 'cssSrc':
            return `<link rel="stylesheet" href="${content}" ${attrText}/>`
        case 'css':
            return `<style ${attrText}>${content}</style>`
    }
}

function generateContent() {
    return this.__contents__.reduce((a, b) => {
        return a + generate(b);
    }, '')
}

function push(content, type="jsSrc", attr) {
    this.__contents__.push({ content, type, attr });
    return this;
}