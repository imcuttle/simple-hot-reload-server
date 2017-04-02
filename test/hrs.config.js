/**
 * Created by moyu on 2017/4/2.
 */

module.exports = {
    proxy: {
        "/api": {
            redirect: true, // default: true
            target: "http://blog.moyuyc.xyz/api",
            headers: {
                "Cookie": "HRS.ID=HRS.TEST;",
            },
            changeHost: false  // default: true
        }
    },

    setUp: function (app) {
        /* app is an express server object. */

        // http://localhost:8082/test
        app.get('/test', function (req, res) {
            res.end("TEST!");
        });
    }
};