/**
 * Created by moyu on 2017/4/2.
 */

module.exports = {
    setUp: function (app) {
        app.get('/test', function (req, res) {
            res.end("TEST!");
        });
    }
};