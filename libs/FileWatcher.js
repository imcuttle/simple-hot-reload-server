/**
 * Created by moyu on 2017/3/28.
 */

const fs = require('fs');
const util = require('util');

function FileWatcher (filename, options) {
    this.options = Object.assign({recursive: true}, options);
    this.filename = filename;
    this.__watch = fs.watch(filename, this.options);
    return this;
}

FileWatcher.prototype = {
    constructor: FileWatcher,
    unwatch: function () {
        this.__watch.close();
        delete this;
    },
    on: function (type, func) {
        func = func.bind(this);
        arguments[1] = func;
        return this.__watch.on.apply(this.__watch, arguments);
    },
    once: function (type, func) {
        func = func.bind(this);
        arguments[1] = func;
        return this.__watch.once.apply(this.__watch, arguments);
    },
}

module.exports = FileWatcher;


