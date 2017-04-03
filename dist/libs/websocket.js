'use strict';

/**
 * Created by moyu on 2017/3/28.
 */
var WebSocket = require('ws');
var url = require('url');
var path = require('path');
var readFilePromise = require('../helpers/readfile-promise');
var ft = require('../helpers/file-type');
var KVStorage = require('../helpers/KVStorage');
var FileWatcher = require('./FileWatcher');
var HTMLEditor = require('./HtmlEditor');

var watcherDB = new KVStorage();

var obj = function obj(type, data) {
    if (Array.isArray(type)) {
        if (!Array.isArray(data)) {
            data = [data];
        }
    }
    return JSON.stringify({ type: type, data: data });
};

module.exports = function run(dirPath, app, options) {
    var wss = new WebSocket.Server(options);

    function broadcast() {
        var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "log";
        var data = arguments[1];
        var filter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {
            return true;
        };

        wss.clients.forEach(function (client) {
            if (client.readyState === WebSocket.OPEN && filter(client)) {
                client.send(obj(type, data));
            }
        });
    }

    function initSocket(ws) {
        var PREFIX = ""; //"[HRS] "
        ws.log = function (data) {
            ws.send(obj('log', PREFIX + data));
        };
        ws.error = function (data) {
            ws.send(obj('error', PREFIX + data));
        };
    }

    wss.on('connection', function connection(ws) {
        initSocket(ws);
        ws.log('connected!');
        ws.on('close', function () {
            if (ws.watcher) {
                ws.watcher.close();
                watcherDB.rm(ws.watcher.filename);
                delete ws.watcher;
            }
        });
        ws.on('message', function (data) {
            data = JSON.parse(data);
            var json = data.data;
            json.value = json.value && json.value.trim() || '';
            if (data.type == 'register') {
                switch (json.type) {
                    case 'cors':
                        if (json.value.startsWith(dirPath)) {
                            var relativePath = json.value.substr(dirPath.length);
                            relativePath = relativePath.startsWith('/') ? relativePath.substr(1) : relativePath;
                            app.setPathMap(json.value);
                            json.value = relativePath;
                        } else if (!path.isAbsolute(json.value)) {
                            var _relativePath = json.value;
                            app.setPathMap(path.join(dirPath, _relativePath));
                        } else {
                            var absolutePath = json.value;
                            // if (ft.isHTML(absolutePath)) {
                            // not in workspace
                            var myRoot = json.root ? !path.isAbsolute(json.root) ? path.join(absolutePath, json.root) : json.root : path.dirname(absolutePath);

                            !app.pathMap.exists(absolutePath) && console.log('[CORS] root: %s, file: %s', myRoot, absolutePath);

                            var _require = require('../'),
                                registerFileWatcher = _require.registerFileWatcher;

                            app.setPathMap(absolutePath).then(function () {
                                if (!watcherDB.exists(myRoot)) {
                                    watcherDB.set(myRoot, true);
                                    ws.watcher = registerFileWatcher(myRoot, { recursive: true });
                                }
                            });
                            // }
                        }
                        break;
                    case 'same-origin':
                    default:
                        json.type = 'same-origin';
                        var pathname = url.parse(json.value).pathname;
                        if (!/\.(html|htm)$/.test(pathname)) {
                            pathname += (pathname.endsWith('/') ? '' : '/') + 'index.html';
                        }
                        json.value = pathname = pathname.substr(1);
                        app.setPathMap(path.join(dirPath, pathname));
                }

                ws.registerData = json;
            } else {
                if (console[data.type]) {
                    var tag = data.type[0].toUpperCase() + data.type.substr(1);
                    process.stdout.write(tag + ': ');
                    console[data.type].apply(null, json);
                } else {
                    console.log('received data from client: %s', JSON.stringify(json));
                }
            }
        });
    });

    wss.broadcast = broadcast;
    return wss;
};