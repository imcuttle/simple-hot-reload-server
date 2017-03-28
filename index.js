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

const app = require('./libs/http-server');
const createWss = require('./libs/websocket');
const connect = require('./helpers/connect-ws-server');
const FileWatcher = require('./libs/FileWatcher');

const server = connect(app, options.port);
const wss = createWss({server});

app.setStatic({
    path: options.path,
    injectGlobalData: {
        port: options.port
    }
});

const watcher = new FileWatcher(options.path);
watcher.on('change', (eventType, filename) => {
    console.log(`Detected file's change: ${filename} => ${eventType}`);
    wss.broadcast(['log', 'reload'], [`${filename} => ${eventType}`, null], (client) => {
        return client.pathname == filename;
    });
});
