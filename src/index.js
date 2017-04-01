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

    process.exit(0);
}

if (options.version) {
    console.log(require('./package.json').version);
    process.exit(0);
}
const fs = require('fs');
if (!fs.existsSync(options.path) || !fs.statSync(options.path).isDirectory()) {
    console.error(`${options.path} not existed or is NOT a directory`);
    process.exit(1);
}

const app = require('./libs/http-server');
const createWss = require('./libs/websocket');
const connect = require('./helpers/connect-ws-server');
const ft = require('./helpers/file-type');
const FileWatcher = require('./libs/FileWatcher');
const server = connect(app, options.port, function () {
    console.log('Map Data => http://localhost:%d%s', options.port, app.MAP_ROUTE)
    console.log('File View => http://localhost:%d%s', options.port, app.FILE_VIEW_ROUTE)
});
const wss = createWss(options.path, {server});

app.setStatic({
    path: options.path,
    injectGlobalData: {
        port: options.port
    }
});

exports.handleFileChange = function (eventType, filename) {
    const log = () => console.log(`Detected file's change: ${path.join(this.filename, filename)} => ${eventType}`);
    const filter = (client, name=filename) => {
        return path.isAbsolute(client.registerData.value)
            ? client.registerData.value == path.join(this.filename, name) : client.registerData.value == name
    };
    if (ft.isHTML(filename)) {
        const absolutePath = path.join(this.filename, filename);
        app.setPathMap(absolutePath, true).then(() => {
            log();
            wss.broadcast(['log', 'reload'], [`${filename} => ${eventType}`, null], filter);
        });
    } else {
        app.pathMap.keys().forEach((htmlPath)  => {
            const absolutePath = path.join(this.filename, filename);
            if (app.pathMap.get(htmlPath)[absolutePath]) {
                if (htmlPath.startsWith(this.filename)) {
                    log();
                    let relativePath = htmlPath.substr(this.filename.length);
                    relativePath = relativePath.startsWith('/') ? relativePath.substr(1) : relativePath;
                    wss.broadcast(['log', 'reload'], [`${filename} => ${eventType}`, null], (client) => {
                        return filter(client, relativePath);
                    });
                }
            }
        });
    }
};

const watcher = new FileWatcher(options.path);
watcher.on('change', exports.handleFileChange);
