/**
 * Created by moyu on 2017/3/28.
 */
const http = require('http');

module.exports = function (app, port) {
    const server = http.createServer(app).listen(port, () => {
        console.log('Server Address: http://localhost:%d', server.address().port);
    });
    return server;
}