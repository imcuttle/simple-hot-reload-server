'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Created by moyu on 2017/3/28.
 */
var url = require('url');
var path = require('path');
var ft = require('../helpers/file-type');
var HtmlEditor = require('../libs/HtmlEditor');

var _require = require('../'),
    registerFileWatcher = _require.registerFileWatcher;

var forward = require('../helpers/forward-request');

module.exports = function () {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _ref = arguments[1];
    var app = _ref.app,
        injectGlobalData = _ref.injectGlobalData;
    var setUp = config.setUp,
        proxy = config.proxy,
        hotRule = config.hotRule;


    if ((typeof proxy === 'undefined' ? 'undefined' : _typeof(proxy)) === 'object') {
        Object.keys(proxy).forEach(function (route) {
            var proxyConfig = proxy[route];
            var target = proxyConfig.target,
                hot = proxyConfig.hot,
                mapLocal = proxyConfig.mapLocal,
                mapRoot = proxyConfig.mapRoot,
                hotRule = proxyConfig.hotRule;

            delete proxyConfig['target'];
            delete proxyConfig['hot'];
            delete proxyConfig['mapLocal'];
            delete proxyConfig['mapRoot'];
            delete proxyConfig['hotRule'];

            var isValidHot = ft.isHTML;
            if (hotRule instanceof RegExp) {
                isValidHot = function isValidHot(filename) {
                    return hotRule.test(filename);
                };
            } else if (typeof hotRule === 'function') {
                isValidHot = hotRule;
            }

            target = target.trim();

            console.log('Proxy created: ' + route + '  ->  ' + target);
            app.use(route, function forwardHandle(req, res, next) {
                target = target.endsWith('/') ? target : target + '/';
                var rUrl = req.url.replace(/^\//, '');
                var to = target + rUrl;

                console.log('Proxy:', req.originalUrl, " -> ", to);

                var localFilename = null,
                    responseHandle = null;
                if (hot && typeof mapLocal === 'function' && !!(localFilename = mapLocal(req)) && isValidHot(localFilename, req)) {
                    responseHandle = function responseHandle(remoteRes, res) {
                        var rootDir = typeof mapRoot === 'function' ? mapRoot(req) : mapRoot;
                        var text = '';
                        remoteRes.setEncoding(null);
                        remoteRes.on('data', function (chunk) {
                            return text += chunk;
                        });
                        remoteRes.on('end', function () {
                            var html = app.injectHotHtml({
                                html: text, filename: localFilename,
                                injectGlobalData: injectGlobalData,
                                scriptAttr: {
                                    'hrs-local': path.resolve(localFilename),
                                    'hrs-root': rootDir
                                }
                            });
                            res.getHeader('content-length') && res.setHeader('content-length', html.length);
                            res.end(html);
                        });
                    };
                }

                // console.log(localFilename, responseHandle);
                proxyConfig.responseHandle = responseHandle;
                forward(req, res, to, proxyConfig).catch(function (err) {
                    return console.error(err);
                });
            });
        });
    }

    if (typeof hotRule === 'function') {
        ft.isHTML = function (filename) {
            return hotRule(filename);
        };
    } else if (hotRule instanceof RegExp) {
        ft.isHTML = function (filename) {
            return hotRule.test(filename);
        };
    }

    if (typeof setUp === 'function') {
        setUp(app);
    }
};