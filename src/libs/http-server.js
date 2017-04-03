/**
 * Created by moyu on 2017/3/28.
 */
const express = require('express');
const logger = require('morgan');
const url = require('url');
const fs = require('fs');
const path = require('path');
const readFilePromise = require('../helpers/readfile-promise');
const HTMLEditor = require('./HtmlEditor');
const ft = require('../helpers/file-type');
const KVStorage = require('../helpers/KVStorage');
const forward = require('../helpers/forward-request');
const dirMiddleware = require('../helpers/express-dir-middleware');

function startServer() {
    const app = express();
    const pathMap = app.pathMap = new KVStorage();
// app.use(logger('dev'));
    app.use('/__hrs__/client-script.js', (req, res, next) => {
        const filename = path.resolve(__dirname, '../client-script.js');
        res.sendFile(filename);
    });

    const MAP_ROUTE = app.MAP_ROUTE = '/__hrs__/map';
    const FILE_VIEW_ROUTE = app.FILE_VIEW_ROUTE = '/__hrs__/file';
    const FORWARD_ROUTE = app.FORWARD_ROUTE = '/__hrs__/forward';
    app.use(MAP_ROUTE, (req, res, next) => {
        res.json(pathMap.entries());
    });
    app.use(FORWARD_ROUTE, (req, res, next) => {
        const url = req.query.url;
        if (url) {
            forward(req, res, url).catch(console.error);
            return;
        }
        res.end('no url param');
    });

    app.setPathMap = function (absolutePath, force) {
        if ( fs.existsSync(absolutePath) && (force || !pathMap.exists(absolutePath)) ) {
            return readFilePromise(absolutePath)
                .then(buf => {
                    let editor = new HTMLEditor(buf.toString(), absolutePath);
                    pathMap.set(absolutePath, editor.getComputedPathMap());
                    return true;
                })
        }
        return Promise.resolve(false);
    };


    const injectHotHtml = app.injectHotHtml = function ({html, scriptAttr, filename, injectGlobalData}) {
        const clientScriptSrc = `/__hrs__/client-script.js`;
        let editor = new HTMLEditor(html, filename);
        if (!pathMap.exists(filename)) {
            pathMap.set(filename, editor.getComputedPathMap())
        }
        return editor.append(`window.__HRS_DATA__=${JSON.stringify(injectGlobalData)}`, 'js')
            .append(clientScriptSrc, 'jsSrc', scriptAttr)
            .getComputedHTML();
    };

    /**
     *
     * @param options: object {path: string, serverPath: string, injectGlobalData: {port: number}}
     */
    app.setStatic = function (options) {
        const dirPath = options.path;
        const serverPath = options.serverPath || '/';
        const injectGlobalData = options.injectGlobalData || {};

        app.use(FILE_VIEW_ROUTE, dirMiddleware({
            redirect: true,
            root: dirPath, app
        }));

        console.log('%s register on %s', dirPath, serverPath);
        app.use(serverPath, function handle(req, res, next) {
            const pathname = decodeURIComponent(url.parse(req.originalUrl).pathname);
            let filename = path.join(dirPath, pathname);
            if (!fs.existsSync(filename)) {
                next();
                return;
            }
            const stat = fs.statSync(filename);
            if (stat.isDirectory()) {
                filename = path.join(filename, 'index.html');
                !fs.existsSync(filename) && next();
            }

            if (ft.isHTML(filename)) {
                readFilePromise(filename)
                    .then(buffer => {
                        let html = buffer.toString();
                        html = injectHotHtml({html, filename, injectGlobalData});

                        res.contentType(path.basename(filename));
                        res.send(html);
                    })
            } else {
                res.sendFile(filename);
            }
        });

        app.use(serverPath, function mapRouter(req, res, next) {
            let pathname = decodeURIComponent(url.parse(req.originalUrl).pathname);
            const END = '.hrs.map';
            if (!pathname.endsWith(END)) {
                next();
                return;
            }
            pathname = pathname.replace(new RegExp(END+"$"), '');
            let filename = path.join(dirPath, pathname);
            if (!fs.existsSync(filename)) {
                next();
                return;
            }
            const stat = fs.statSync(filename);
            if (stat.isDirectory()) {
                filename = path.join(filename, 'index.html');
                !fs.existsSync(filename) && next();
            }

            if (ft.isHTML(filename)) {
                readFilePromise(filename)
                    .then(buffer => {
                        let html = buffer.toString();
                        res.json(pathMap.getOrSet(filename, function () {
                            return new HTMLEditor(html, filename).getComputedPathMap();
                        }));
                    });
            } else {
                res.end("Error: not Found HTML file which named "+filename);
            }
        })
    };

    return app;
}



module.exports = startServer;