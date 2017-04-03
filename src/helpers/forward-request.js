/**
 * Created by moyu on 2017/3/31.
 */
const URL = require('url')

function forwardRequest(req, res, url, opts={}) {
    const {
        redirect=true, changeHost=true, headers: optHeaders,
        responseHandle,
    } = opts;
    const urlAsg = URL.parse(url, true);
    const headers = Object.assign({}, req.headers, optHeaders);
    if (changeHost) {
        headers['host'] = urlAsg.host;
    }
    // XHR, CORS Support
    delete headers['x-requested-with'];

    // console.log(headers);
    const urlOptions = {
        host: urlAsg.host,
        hostname: urlAsg.hostname,
        port: urlAsg.port || 80,
        path: urlAsg.path,
        method: req.method,
        headers: headers,
        rejectUnauthorized: false
    };


    return new Promise(function (resolve, reject) {

        const protocol = (urlAsg.protocol === 'http:' ? require('http') : require('https'))
        const forward_request = protocol.request(urlOptions, function (response) {
            const code = response.statusCode;
            // console.log(code, response.headers, redirect);
            if (!redirect && (code === 302 || code === 301) ) {
                let location = response.headers.location;
                response.destroy();
                forward_request.abort();
                location = URL.resolve(url, location);
                forwardRequest(req, res, location, opts)
                    .then(resolve, reject);
                return;
            }

            res.statusCode = response.statusCode;
            res.statusMessage = response.statusMessage;
            Object.keys(response.headers).forEach(name => {
                let segs = name.split('-');
                segs = segs.map(seg => {
                    seg = seg[0].toUpperCase() + seg.substr(1);
                    return seg;
                });
                let camelName = segs.join('-');
                res.setHeader(camelName, response.headers[name]);
            });

            // console.log(response.headers);
            if (typeof responseHandle === 'function') {
                responseHandle(response, res);
            } else {
                response.pipe(res);
            }
            response.on('end', function () {
                resolve(true);
            })
        });


        forward_request.on('error', function (e) {
            // console.error('problem with request: ' + e.message);
            // if (!res.finished) {
            //     !res.headersSent && res.writeHead(500);
            //     res.end('problem with request: ' + e.message);
            // }
            reject(e);
        });

        req.pipe(forward_request);

    });

}

module.exports = forwardRequest;