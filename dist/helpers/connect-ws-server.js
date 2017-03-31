'use strict';

/**
 * Created by moyu on 2017/3/28.
 */
var http = require('http');

module.exports = function (app, port, callback) {
    var server = http.createServer(app).listen(port, function () {
        console.log('Server Address: http://localhost:%d', server.address().port);
        callback && callback();
    });
    return server;
};