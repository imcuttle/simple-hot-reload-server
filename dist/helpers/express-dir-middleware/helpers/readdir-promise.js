'use strict';

/**
 * Created by moyu on 2017/4/1.
 */
var fs = require('fs');

module.exports = function (filename) {
    return new Promise(function (resolve, reject) {
        fs.readdir(filename, function (err, list) {
            if (err) {
                reject(err);
            } else {
                resolve(list);
            }
        });
    });
};