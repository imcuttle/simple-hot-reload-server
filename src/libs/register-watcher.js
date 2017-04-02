const path = require('path');
const FileWatcher = require('./libs/FileWatcher');
const app = require('./libs/http-server');

const handleFileChange = function (eventType, filename) {
    const log = () => console.log(`Detected file's change: ${path.join(this.filename, filename)} => ${eventType}`);
    const filter = (client, name=filename) => {
        return path.isAbsolute(client.registerData.value)
            ? client.registerData.value == path.join(this.filename, name) : client.registerData.value == name
    };
    const absolutePath = path.join(this.filename, filename);
    if (/*ft.isHTML(filename)*/app.pathMap.exists(absolutePath)) {
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

const registerFileWatcher = module.exports = function (path, opts) {
    const watcher = new FileWatcher(path, opts);
    watcher.on('change', handleFileChange);
    return watcher;
};

