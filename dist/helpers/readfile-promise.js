'use strict';

/**
 * Created by moyu on 2017/3/28.
 */
var fs = require('fs');

module.exports = function (filename, options) {
    return new Promise(function (resolve, reject) {
        fs.readFile(filename, options, function (error, buffer) {
            if (error) {
                reject(error);
            } else {
                resolve(buffer);
            }
        });
    });
};