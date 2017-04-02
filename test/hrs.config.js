/**
 * Created by moyu on 2017/4/2.
 */

module.exports = {
    proxy: {
        "/php": {
            redirect: true, // default: true
            target: "http://localhost:63343/start/",//"http://localhost:6999",
            headers: {
                "Cookie": "_ga=GA1.2.652043234.1486895648; _gat=1; connect.sid=s%3AZp8YLU6HhQuJOloEg-GzF3y66M2CGXxq.pt7S%2FQ1ILKn5LKRTOuHWdoODj32BlGc4d3od%2BU7Qgvo",
            },
            changeHost: true,  // default: true
        }
    },

    // hotRule: /\.(html|htm)$/, // default: /\.(html|htm)$/

    setUp: function (app) {
        /* app is an express server object. */

        // http://localhost:8082/test
        app.get('/test', function (req, res) {
            res.end("TEST!");
        });
    }
};