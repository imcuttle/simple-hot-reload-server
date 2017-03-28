/**
 * Created by moyu on 2017/3/28.
 */

const fs = require('fs');
const util = require('util');

function FileWatcher (filename, options) {
    this.options = Object.assign({recursive: true}, options);
    // this.filename = filename;
    this.__watch = fs.watch(filename, this.options);
    return this.__watch;
}

FileWatcher.prototype = {
    constructor: FileWatcher,
    unwatch: function () {
        this.__watch.close();
        delete this;
    },
    on: function () {
        return this.__watch.on.apply(this.__watch, arguments);
    },
    once: function () {
        return this.__watch.once.apply(this.__watch, arguments);
    },
}

module.exports = FileWatcher;


