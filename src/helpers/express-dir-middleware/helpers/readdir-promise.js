/**
 * Created by moyu on 2017/4/1.
 */
const fs = require('fs');

module.exports = function (filename) {
    return new Promise((resolve, reject) => {
        fs.readdir(filename, (err, list) => {
            if (err) {
                reject(err);
            } else {
                resolve(list);
            }
        })
    })
}