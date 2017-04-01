#!/usr/bin/env node
'use strict';

var path = require('path');
var args = require('minimist')(process.argv.slice(2));

var DEFAULT_POST = 8082;
var options = {
    help: args.h || args.help,
    path: args._.length === 0 ? process.cwd() : path.resolve(args._[0]),
    port: args.p || args.port || DEFAULT_POST,
    version: args.v || args.version
};

if (options.help) {
    console.log('  Usage: hrs [-p port] path\n  \n  Options:\n    \n    -v --version                get current version.\n    -p --port                   set port of server.(default: ' + DEFAULT_POST + ')\n    -h --help                   how to use it.\n');

    process.exit(0);
}

if (options.version) {
    console.log(require('./package.json').version);
    process.exit(0);
}
var fs = require('fs');
if (!fs.existsSync(options.path) || !fs.statSync(options.path).isDirectory()) {
    console.error(options.path + ' not existed or is NOT a directory');
    process.exit(1);
}

var app = require('./libs/http-server');
var createWss = require('./libs/websocket');
var connect = require('./helpers/connect-ws-server');
var ft = require('./helpers/file-type');
var FileWatcher = require('./libs/FileWatcher');
var server = connect(app, options.port, function () {
    console.log('Map Data => http://localhost:%d%s', options.port, app.MAP_ROUTE);
    console.log('File View => http://localhost:%d%s', options.port, app.FILE_VIEW_ROUTE);
});
var wss = createWss(options.path, { server: server });

app.setStatic({
    path: options.path,
    injectGlobalData: {
        port: options.port
    }
});

exports.handleFileChange = function (eventType, filename) {
    var _this = this;

    var log = function log() {
        return console.log('Detected file\'s change: ' + path.join(_this.filename, filename) + ' => ' + eventType);
    };
    var filter = function filter(client) {
        var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : filename;

        return path.isAbsolute(client.registerData.value) ? client.registerData.value == path.join(_this.filename, name) : client.registerData.value == name;
    };
    var absolutePath = path.join(this.filename, filename);
    if ( /*ft.isHTML(filename)*/app.pathMap.exists(absolutePath)) {
        app.setPathMap(absolutePath, true).then(function () {
            log();
            wss.broadcast(['log', 'reload'], [filename + ' => ' + eventType, null], filter);
        });
    } else {
        app.pathMap.keys().forEach(function (htmlPath) {
            var absolutePath = path.join(_this.filename, filename);
            if (app.pathMap.get(htmlPath)[absolutePath]) {
                if (htmlPath.startsWith(_this.filename)) {
                    log();
                    var relativePath = htmlPath.substr(_this.filename.length);
                    relativePath = relativePath.startsWith('/') ? relativePath.substr(1) : relativePath;
                    wss.broadcast(['log', 'reload'], [filename + ' => ' + eventType, null], function (client) {
                        return filter(client, relativePath);
                    });
                }
            }
        });
    }
};

var watcher = new FileWatcher(options.path);
watcher.on('change', exports.handleFileChange);