/**
 * Created by moyu on 2017/3/28.
 */
const WebSocket = require('ws');
const url = require('url');

const obj = (type, data) => {
    if (Array.isArray(type)) {
        if (!Array.isArray(data)) {
            data = [data];
        }
    }
    return JSON.stringify({type, data})
};

module.exports = function run (options) {
    const wss = new WebSocket.Server(options);

    function broadcast(type="log", data, filter=()=>true) {
        wss.clients.forEach(function (client) {
            if (client.readyState === WebSocket.OPEN && filter(client)) {
                client.send(obj(type, data));
            }
        });
    }

    function initSocket (ws) {
        const PREFIX = "[HRS] "
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
        ws.on('message', function (data) {
            data = JSON.parse(data);
            if (data.type == 'register') {
                let pathname = url.parse(data.data).pathname;
                if (pathname == '/') {
                    pathname += 'index.html';
                }
                pathname = pathname.substr(1);
                ws.pathname = pathname;
            }
        });
    });

    wss.broadcast = broadcast;
    return wss;
};


