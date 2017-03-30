/**
 * Created by moyu on 2017/3/28.
 */
const WebSocket = require('ws');
const url = require('url');
const path = require('path');
const app = require('./http-server');
const readFilePromise = require('../helpers/readfile-promise');
const ft = require('../helpers/file-type');
const FileWatcher = require('./FileWatcher');
const HTMLEditor = require('./HtmlEditor');

const obj = (type, data) => {
    if (Array.isArray(type)) {
        if (!Array.isArray(data)) {
            data = [data];
        }
    }
    return JSON.stringify({type, data})
};

module.exports = function run (dirPath, options) {
    const wss = new WebSocket.Server(options);

    function broadcast(type="log", data, filter=()=>true) {
        wss.clients.forEach(function (client) {
            if (client.readyState === WebSocket.OPEN && filter(client)) {
                client.send(obj(type, data));
            }
        });
    }

    function initSocket (ws) {
        const PREFIX = "";//"[HRS] "
        ws.log = function (data) {
            ws.send(obj('log', PREFIX+data))
        }
        ws.error = function (data) {
            ws.send(obj('error', PREFIX+data))
        }
    }


    wss.on('connection', function connection (ws) {
        initSocket(ws);
        ws.log('connected!');
        ws.on('close', () => {
            ws.watcher && ws.watcher.close();
        });
        ws.on('message', function (data) {
            data = JSON.parse(data);
            let json = data.data;
            json.value = json.value && json.value.trim() || '';
            if (data.type == 'register') {
                switch (json.type) {
                    case 'cors':
                        if (json.value.startsWith(dirPath)) {
                            let relativePath = json.value.substr(dirPath.length);
                            relativePath = relativePath.startsWith('/')?relativePath.substr(1):relativePath;
                            app.setPathMap(json.value);
                            json.value = relativePath;
                        } else if (!path.isAbsolute(json.value)){
                            let relativePath = json.value;
                            app.setPathMap(path.join(dirPath, relativePath));
                        } else {
                            let absolutePath = json.value;
                            if (ft.isHTML(absolutePath)) {
                                // not in workspace
                                let myRoot = json.root ? (!path.isAbsolute(json.root) ? path.join(absolutePath, json.root) : json.root) : path.dirname(absolutePath);
                                // console.log('root: %s, file: %s', myRoot, absolutePath);
                                const handleFileChange = require('../').handleFileChange;
                                app.setPathMap(absolutePath).then(() => {
                                    ws.watcher = new FileWatcher(myRoot, {recursive: true})
                                        .on('change', handleFileChange);
                                });
                            }
                        }
                        break;
                    case 'same-origin':
                    default:
                        json.type = 'same-origin';
                        let pathname = url.parse(json.value).pathname;
                        if (!/\.(html|htm)$/.test(pathname)) {
                            pathname += (pathname.endsWith('/')?'':'/') + 'index.html';
                        }
                        json.value = pathname = pathname.substr(1);
                        app.setPathMap(path.join(dirPath, pathname));
                }


                ws.registerData = json;
            }
        });
    });

    wss.broadcast = broadcast;
    return wss;
};


