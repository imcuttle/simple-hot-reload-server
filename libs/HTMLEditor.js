/**
 * Created by moyu on 2017/3/28.
 */

function HTMLEditor(html) {
    this.html = html;
    this.__contents__ = [];
}



HTMLEditor.prototype.append = push;
HTMLEditor.prototype._generateContent = generateContent;
HTMLEditor.prototype.getComputedHTML = getComputedHTML;

module.exports  = HTMLEditor;

function getComputedHTML() {
    let html = this.html;
    const closedBodyMarketReg = /\<\s*\/\s*body\s*\>[\s\S]*$/;
    const index = html.search(closedBodyMarketReg);
    if (index >= 0) {
        html = html.slice(0, index)
            + this._generateContent()
            + html.slice(index);
    }
    return html;
}

function generate(object) {
    const content = object.content;
    switch (object.type) {
        case 'jsSrc':
            return `<script type="application/javascript" src="${content}"></script>`
        case 'js':
            return `<script type="application/javascript">${content}</script>`
        case 'cssSrc':
            return `<link rel="stylesheet" href="${content}"/>`
        case 'css':
            return `<style>${content}</style>`
    }
}

function generateContent() {
    return this.__contents__.reduce((a, b) => {
        return a + generate(b);
    }, '')
}

function push(content, type="jsSrc") {
    this.__contents__.push({ content, type });
    return this;
}