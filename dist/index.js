'use strict';

var p = require('path');
var fs = require('fs');

var startServer = require('./libs/http-server');
var createWss = require('./libs/websocket');
var connect = require('./helpers/connect-ws-server');
var ft = require('./helpers/file-type');
var FileWatcher = require('./libs/FileWatcher');

module.exports = function (_ref) {
    var _ref$port = _ref.port,
        port = _ref$port === undefined ? 8082 : _ref$port,
        _ref$path = _ref.path,
        path = _ref$path === undefined ? "." : _ref$path,
        config = _ref.config;

    var app = startServer();

    var server = connect(app, port, function () {
        console.log('Map Data  ->  http://localhost:%d%s', port, app.MAP_ROUTE);
        console.log('File View  ->  http://localhost:%d%s', port, app.FILE_VIEW_ROUTE);
    });

    path = p.resolve(path);
    var wss = createWss(path, app, { server: server });

    var injectGlobalData = { port: port };
    if (config) {
        var configWorker = require('./libs/config-worker');
        configWorker(config, { app: app, injectGlobalData: injectGlobalData });
        console.log("Config is Working!");
    }

    app.setStatic({
        path: path,
        injectGlobalData: injectGlobalData
    });

    var handleFileChange = function handleFileChange(eventType, filename) {
        var _this = this;

        var log = function log() {
            return console.log('Detected file\'s change: ' + p.join(_this.filename, filename) + ' => ' + eventType);
        };
        var filter = function filter(client) {
            var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : filename;

            return p.isAbsolute(client.registerData.value) ? client.registerData.value == p.join(_this.filename, name) : client.registerData.value == name;
        };
        var absolutePath = p.join(this.filename, filename);
        if ( /*ft.isHTML(filename)*/app.pathMap.exists(absolutePath)) {
            app.setPathMap(absolutePath, true).then(function () {
                log();
                wss.broadcast(['log', 'reload'], [filename + ' => ' + eventType, null], filter);
            });
        } else {
            app.pathMap.keys().forEach(function (htmlPath) {
                var absolutePath = p.join(_this.filename, filename);
                var isCssChange = absolutePath.endsWith(".css");
                var string = null;
                if (string = app.pathMap.get(htmlPath)[absolutePath]) {
                    if (htmlPath.startsWith(_this.filename)) {
                        log();
                        var relativePath = htmlPath.substr(_this.filename.length);
                        relativePath = relativePath.startsWith('/') ? relativePath.substr(1) : relativePath;
                        wss.broadcast(['log', isCssChange ? 'refreshCSS' : 'reload'], [filename + '(' + string + ') => ' + eventType, isCssChange ? [string] : null], function (client) {
                            return filter(client, relativePath);
                        });
                    }
                }
            });
        }
    };

    var registerFileWatcher = module.exports.registerFileWatcher = function (path, opts) {
        var watcher = new FileWatcher(path, opts);
        watcher.on('change', handleFileChange);
        return watcher;
    };

    registerFileWatcher(path);
};