'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Created by moyu on 2017/3/28.
 */
var url = require('url');
var forward = require('../helpers/forward-request');

module.exports = function () {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _ref = arguments[1];
    var app = _ref.app;
    var setUp = config.setUp,
        proxy = config.proxy;


    if ((typeof proxy === 'undefined' ? 'undefined' : _typeof(proxy)) === 'object') {
        Object.keys(proxy).forEach(function (route) {
            var target = proxy[route].target;

            target = target.trim();
            console.log('Proxy created: ' + route + '  ->  ' + target);
            app.use(route, function forwardHandle(req, res, next) {
                target = target.endsWith('/') ? target : target + '/';
                var rUrl = req.url.replace(/^\//, '');
                var to = target + rUrl;
                console.log('Proxy:', req.originalUrl, " -> ", to);
                forward(req, res, to, proxy[route]).catch(function (err) {
                    return console.error(err);
                });
            });
        });
    }

    if (typeof setUp === 'function') {
        setUp(app);
    }
};