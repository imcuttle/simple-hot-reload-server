"use strict";

/**
 * Created by moyu on 2017/3/28.
 */

function KVStorage() {
    this.database = {};
}

KVStorage.prototype.exists = function (key) {
    return !!this.get(key);
};

KVStorage.prototype.entries = function (key) {
    return this.database;
};

KVStorage.prototype.keys = function () {
    return Object.keys(this.database);
};

KVStorage.prototype.merge = function (key, mergeVal) {
    var old = this.get(key) || {};
    return this.set(key, Object.assign(old, mergeVal));
};

KVStorage.prototype.getOrSet = function (key, getValue) {
    var old = this.get(key);
    if (old) {
        return old;
    } else {
        var newVal = getValue && getValue();
        this.set(key, newVal);
        return newVal;
    }
};

KVStorage.prototype.set = function (key, value) {
    this.database[key] = value;
    return this;
};

KVStorage.prototype.rm = function (key, value) {
    return delete this.database[key];
};

KVStorage.prototype.get = function (key) {
    return this.database[key];
};

KVStorage.prototype.clear = function () {
    this.database = {};
};

module.exports = KVStorage;