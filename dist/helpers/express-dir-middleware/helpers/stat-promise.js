'use strict';

/**
 * Created by moyu on 2017/4/1.
 */
var fs = require('fs');

module.exports = function (filename) {
    return new Promise(function (resolve, reject) {
        fs.stat(filename, function (err, state) {
            if (err) {
                reject(err);
            } else {
                resolve(state);
            }
        });
    });
};