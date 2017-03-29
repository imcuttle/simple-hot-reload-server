#!/usr/bin/env node

const path = require('path');
const args = require('minimist')(process.argv.slice(2));

const DEFAULT_POST = 8082;
const options = {
    help: args.h || args.help,
    path: args._.length === 0 ? process.cwd() : path.resolve(args._[0]),
    port: args.p || args.port || DEFAULT_POST,
    version: args.v || args.version
};

if (options.help) {
    console.log(
`  Usage: hrs [-p port] path
  
  Options:
    
    -v --version                get current version.
    -p --port                   set port of server.(default: ${DEFAULT_POST})
    -h --help                   how to use it.
`
    );

    return;
}

if (options.version) {
    console.log(require('./package.json').version);
    return;
}
const fs = require('fs');
if (!fs.existsSync(options.path) || !fs.statSync(options.path).isDirectory()) {
    console.error(`${options.path} not existed or is NOT a directory`);
    return 1;
}

const app = require('./libs/http-server');
const createWss = require('./libs/websocket');
const connect = require('./helpers/connect-ws-server');
const ft = require('./helpers/file-type');
const FileWatcher = require('./libs/FileWatcher');

const server = connect(app, options.port, function () {
    console.log('Map Data => http://localhost:%d%s', options.port, app.MAP_ROUTE)
});
const wss = createWss(options.path, {server});


app.setStatic({
    path: options.path,
    injectGlobalData: {
        port: options.port
    }
});


const watcher = new FileWatcher(options.path);
watcher.on('change', (eventType, filename) => {
    const log = () => console.log(`Detected file's change: ${filename} => ${eventType}`);
    if (ft.isHTML(filename)) {
        const absolutePath = path.join(options.path, filename);
        app.setPathMap(absolutePath, true).then(() => {
            log();
            wss.broadcast(['log', 'reload'], [`${filename} => ${eventType}`, null], (client) => {
                return client.pathname == filename;
            });
        });
    } else {
        app.pathMap.keys().forEach(function (htmlPath) {
            const absolutePath = path.join(options.path, filename);
            if (app.pathMap.get(htmlPath)[absolutePath]) {
                if (htmlPath.startsWith(options.path)) {
                    log();
                    let relativePath = htmlPath.substr(options.path.length);
                    relativePath = relativePath.startsWith('/') ? relativePath.substr(1) : relativePath;
                    wss.broadcast(['log', 'reload'], [`${filename} => ${eventType}`, null], (client) => {
                        return client.pathname == relativePath;
                    });
                }
            }
        });
    }

});
