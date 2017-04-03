module.exports = {
    proxy: {
        "/api": {
            target: "http://www.huya.com/longdd",
        },
        "/php": {
            redirect: true, // default: true
            target: "http://localhost:63343/start/static",//"http://localhost:6999",
            changeHost: true,  // default: true

            hot: true, // hot reload enable? default: false
            // Function/RegExp: will be set root config hotRule if it is null
            hotRule: function (filename, request) {
                // console.log(request.url);
                return /\.(php)$/.test(filename);
            },
            // Function: return local file path
            mapLocal: function (request) {
                // request: Express Request Object
                // console.log('mapLocal', request.originalUrl, request.baseUrl, request.url);
                const url = request.url.replace(/\?[\s\S]*/, '')
                return "/Users/moyu/my-code/phpCode/start/static" + url;
            },
            // Function/String: return detected directory path
            mapRoot: function (request) {
                // request: Express Request Object
                return "/Users/moyu/my-code/phpCode/start/static";
            }
        },
    },

    // RegExp or function (filename) {...}
    hotRule: /\.(html|htm)$/, // default: /\.(html|htm)$/

    setUp: function (app) {
        /* app is an express server object. */

        // http://localhost:8082/test
        app.get('/test', function (req, res) {
            res.end("TEST!");
        });
    }
};