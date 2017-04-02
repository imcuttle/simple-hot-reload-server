/**
 * Created by moyu on 2017/3/28.
 */
const url = require('url');
const forward = require('../helpers/forward-request');

module.exports = function (config={}, {app}) {
    const {setUp, proxy} = config;

    if (typeof proxy === 'object') {
        Object.keys(proxy)
            .forEach((route) => {
                let {target} = proxy[route];
                target = target.trim();
                console.log(`Proxy created: ${route}  ->  ${target}`);
                app.use(route, function forwardHandle(req, res, next) {
                    target = target.endsWith('/') ? target : target+'/';
                    const rUrl = req.url.replace(/^\//, '');
                    const to = target + rUrl;
                    console.log('Proxy:', req.originalUrl, " -> ", to);
                    forward(req, res, to, proxy[route])
                        .catch(err => console.error(err));
                });
            })
    }

    if (typeof setUp === 'function') {
        setUp(app);
    }
};

