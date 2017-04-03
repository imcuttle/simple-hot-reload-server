/**
 * Created by moyu on 2017/3/28.
 */
const url = require('url');
const path = require('path');
const ft = require('../helpers/file-type');
const HtmlEditor = require('../libs/HtmlEditor');
const {registerFileWatcher} = require('../');
const forward = require('../helpers/forward-request');

module.exports = function (config = {}, {app, injectGlobalData}) {
    const {setUp, proxy, hotRule} = config;

    if (typeof proxy === 'object') {
        Object.keys(proxy)
            .forEach((route) => {
                const proxyConfig = proxy[route];
                let {target, hot, mapLocal, mapRoot, hotRule} = proxyConfig;
                delete proxyConfig['target'];
                delete proxyConfig['hot'];
                delete proxyConfig['mapLocal'];
                delete proxyConfig['mapRoot'];
                delete proxyConfig['hotRule'];

                let isValidHot = ft.isHTML;
                if (hotRule instanceof RegExp) {
                    isValidHot = (filename) => hotRule.test(filename);
                } else if (typeof hotRule === 'function') {
                    isValidHot = hotRule;
                }

                target = target.trim();

                console.log(`Proxy created: ${route}  ->  ${target}`);
                app.use(route, function forwardHandle(req, res, next) {
                    target = target.endsWith('/') ? target : target + '/';
                    const rUrl = req.url.replace(/^\//, '');
                    const to = target + rUrl;

                    console.log('Proxy:', req.originalUrl, " -> ", to);

                    let localFilename = null, responseHandle = null;
                    if (hot && typeof mapLocal === 'function'
                        && !!(localFilename = mapLocal(req)) && isValidHot(localFilename, req)) {
                        responseHandle = (remoteRes, res) => {
                            let rootDir = typeof mapRoot === 'function' ? mapRoot(req) : mapRoot;
                            let text = '';
                            remoteRes.setEncoding(null);
                            remoteRes.on('data', (chunk) => text += chunk)
                            remoteRes.on('end', () => {
                                const html = app.injectHotHtml({
                                    html: text, filename: localFilename,
                                    injectGlobalData,
                                    scriptAttr: {
                                        'hrs-local': path.resolve(localFilename),
                                        'hrs-root': rootDir
                                    }
                                });
                                res.getHeader('content-length') && res.setHeader('content-length', html.length);
                                res.end(html);

                            });
                        }
                    }

                    // console.log(localFilename, responseHandle);
                    proxyConfig.responseHandle = responseHandle;
                    forward(req, res, to, proxyConfig)
                        .catch(err => console.error(err));
                });
            })
    }

    if (typeof hotRule === 'function') {
        ft.isHTML = function (filename) {
            return hotRule(filename);
        };
    } else if (hotRule instanceof RegExp) {
        ft.isHTML = function (filename) {
            return hotRule.test(filename);
        };
    }

    if (typeof setUp === 'function') {
        setUp(app);
    }
};

