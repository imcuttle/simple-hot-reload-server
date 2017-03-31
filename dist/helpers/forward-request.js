'use strict';

/**
 * Created by moyu on 2017/3/31.
 */
var URL = require('url');

function forwardRequest(req, res, url) {
    var urlAsg = URL.parse(url, true);
    var headers = req.headers;
    var urlOptions = {
        host: urlAsg.host,
        port: urlAsg.port || 80,
        path: urlAsg.path,
        method: req.method,
        headers: headers };

    var protocol = urlAsg.protocol === 'http:' ? require('http') : require('https');
    var forward_request = protocol.request(urlOptions, function (response) {
        var code = response.statusCode;
        if (code === 302 || code === 301) {
            var location = response.headers.location;
            response.destroy();
            forward_request.abort();
            forwardRequest(req, res, location);
            return;
        }
        res.writeHead(code, response.headers);
        response.pipe(res);
    });

    forward_request.on('error', function (e) {
        console.error('problem with request: ' + e.message);
    });

    req.pipe(forward_request);
}

module.exports = forwardRequest;