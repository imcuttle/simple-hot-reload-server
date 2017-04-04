'use strict';

/**
 * Created by moyu on 2017/3/28.
 */
var express = require('express');
// const logger = require('morgan');
var url = require('url');
var fs = require('fs');
var path = require('path');
var readFilePromise = require('../helpers/readfile-promise');
var HTMLEditor = require('./HtmlEditor');
var ft = require('../helpers/file-type');
var KVStorage = require('../helpers/KVStorage');
var forward = require('../helpers/forward-request');
var dirMiddleware = require('express-dirview-middleware');

function startServer() {
    var app = express();
    var pathMap = app.pathMap = new KVStorage();
    // app.use(logger('dev'));
    app.use('/__hrs__/client-script.js', function (req, res, next) {
        var filename = path.resolve(__dirname, '../client-script.js');
        res.sendFile(filename);
    });

    var MAP_ROUTE = app.MAP_ROUTE = '/__hrs__/map';
    var FILE_VIEW_ROUTE = app.FILE_VIEW_ROUTE = '/__hrs__/file';
    var FORWARD_ROUTE = app.FORWARD_ROUTE = '/__hrs__/forward';
    app.use(MAP_ROUTE, function (req, res, next) {
        res.json(pathMap.entries());
    });
    app.use(FORWARD_ROUTE, function (req, res, next) {
        var url = req.query.url;
        if (url) {
            forward(req, res, url).catch(console.error);
            return;
        }
        res.end('no url param');
    });

    app.setPathMap = function (absolutePath, force) {
        if (fs.existsSync(absolutePath) && (force || !pathMap.exists(absolutePath))) {
            return readFilePromise(absolutePath).then(function (buf) {
                var editor = new HTMLEditor(buf.toString(), absolutePath);
                pathMap.set(absolutePath, editor.getComputedPathMap());
                return true;
            });
        }
        return Promise.resolve(false);
    };

    var injectHotHtml = app.injectHotHtml = function (_ref) {
        var html = _ref.html,
            scriptAttr = _ref.scriptAttr,
            filename = _ref.filename,
            injectGlobalData = _ref.injectGlobalData;

        var clientScriptSrc = '/__hrs__/client-script.js';
        var editor = new HTMLEditor(html, filename);
        if (!pathMap.exists(filename)) {
            pathMap.set(filename, editor.getComputedPathMap());
        }
        return editor.append('window.__HRS_DATA__=' + JSON.stringify(injectGlobalData), 'js').append(clientScriptSrc, 'jsSrc', scriptAttr).getComputedHTML();
    };

    /**
     *
     * @param options: object {path: string, serverPath: string, injectGlobalData: {port: number}}
     */
    app.setStatic = function (options) {
        var dirPath = options.path;
        var serverPath = options.serverPath || '/';
        var injectGlobalData = options.injectGlobalData || {};

        app.use(FILE_VIEW_ROUTE, dirMiddleware({
            redirect: true,
            root: dirPath
        }));

        console.log('%s register on %s', dirPath, serverPath);
        app.use(serverPath, function handle(req, res, next) {
            var pathname = decodeURIComponent(url.parse(req.originalUrl).pathname);
            var filename = path.join(dirPath, pathname);
            if (!fs.existsSync(filename)) {
                next();
                return;
            }
            var stat = fs.statSync(filename);
            if (stat.isDirectory()) {
                filename = path.join(filename, 'index.html');
                !fs.existsSync(filename) && next();
            }

            if (ft.isHTML(filename)) {
                readFilePromise(filename).then(function (buffer) {
                    var html = buffer.toString();
                    html = injectHotHtml({ html: html, filename: filename, injectGlobalData: injectGlobalData });

                    res.contentType(path.basename(filename));
                    res.send(html);
                });
            } else {
                res.sendFile(filename);
            }
        });

        app.use(serverPath, function mapRouter(req, res, next) {
            var pathname = decodeURIComponent(url.parse(req.originalUrl).pathname);
            var END = '.hrs.map';
            if (!pathname.endsWith(END)) {
                next();
                return;
            }
            pathname = pathname.replace(new RegExp(END + "$"), '');
            var filename = path.join(dirPath, pathname);
            if (!fs.existsSync(filename)) {
                next();
                return;
            }
            var stat = fs.statSync(filename);
            if (stat.isDirectory()) {
                filename = path.join(filename, 'index.html');
                !fs.existsSync(filename) && next();
            }

            if (ft.isHTML(filename)) {
                readFilePromise(filename).then(function (buffer) {
                    var html = buffer.toString();
                    res.json(pathMap.getOrSet(filename, function () {
                        return new HTMLEditor(html, filename).getComputedPathMap();
                    }));
                });
            } else {
                res.end("Error: not Found HTML file which named " + filename);
            }
        });
    };

    return app;
}

module.exports = startServer;