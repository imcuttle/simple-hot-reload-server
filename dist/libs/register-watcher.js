'use strict';

var path = require('path');
var FileWatcher = require('./libs/FileWatcher');
var app = require('./libs/http-server');

var handleFileChange = function handleFileChange(eventType, filename) {
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

var registerFileWatcher = module.exports = function (path, opts) {
    var watcher = new FileWatcher(path, opts);
    watcher.on('change', handleFileChange);
    return watcher;
};