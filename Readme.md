# Simple Hot Reload Server

[![NPM](https://nodei.co/npm/simple-hot-reload-server.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/simple-hot-reload-server)

[中文文档点这](https://imcuttle.github.io/say-goodbye-to-manual-refresh)

Set up a server for frontend files(html/css/js/favicon) & Watch frontend files.

connected server and client by WebSocket.

## Feature

- **Hot Reload**
![](https://ooo.0o0.ooo/2017/03/31/58de5c97bfa0b.jpg)

- **Debugger**
![](https://ooo.0o0.ooo/2017/03/31/58de5c83f0eac.jpg)

- **Files View (Easy to open page in root)**  
`http://localhost:8082/__hrs__/file`
![](https://ooo.0o0.ooo/2017/04/01/58df9961dd9b2.jpg)

- **Source Map Preview**

    1. Single  
        `http://localhost:8082/index.html.hrs.map`
        ```json
        {
            "/Users/moyu/my-code/JavaCode/dike/js/jquery-1.9.1.js": "../../js/jquery-1.9.1.js",
            "/Users/moyu/my-code/JavaCode/dike/js/bootstrap.js": "../../js/bootstrap.js",
            "/Users/moyu/my-code/JavaCode/dike/js/navbar.js": "../../js/navbar.js",
            "/Users/moyu/my-code/JavaCode/dike/css/font-awesome.min.css": "../../css/font-awesome.min.css",
            "/Users/moyu/my-code/JavaCode/dike/css/navbar.css": "../../css/navbar.css",
            "/Users/moyu/my-code/JavaCode/dike/css/conceptModel.css": "../../css/conceptModel.css",
            "/Users/moyu/my-code/JavaCode/dike/css/dropzone/dropzone.css": "../../css/dropzone/dropzone.css"
        }
        ```
    2. Total  
        `http://localhost:8082/__hrs__/map`

- **Forward Request**  
    `http://localhost:8082/__hrs__/forward?url=http://blog.moyuyc.xyz/head.jpg`
    
- **Config**  
    Be Named `hrs.config.js` on current work directory.
    ```js
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
    ```

## Install

```bash
npm install -g simple-hot-reload-server
```

```text
Usage: hrs [-p port] path

Options:

  -v --version                get current version.
  -p --port                   set port of server. (default: 8082)
  -c --config                 config path. (default hrs.config.js)
  -h --help                   how to use it.
```

## Others

**Support Local Server**  
*Importance: Only support files which filename ends with `.html/.htm` or is required by html/htm*
1. set up an node server
    ```bash
    hrs path/to/front/root    
    ```
2. open html in address
    ```
    http://localhost:8082/where?dubug=true&reload=true
    ```
    `debug`: whether `console.log/error/...` on browser could print on node server. **default: false**  
    `reload`: whether reload when file changed. **default: true**

**Support CORS**  
*Importance: support all files (php/jsp/asp...)*

1. set up an node server
    ```bash
    hrs
    ```
2. insert script in HTML manually.
    ```html
    <script
        src="http://localhost:8082/__hrs__/client-script.js?reload=false&debug=true"
        hrs-local="/Users/moyu/fe-code/a/b/jsonp.html"
        hrs-root="/Users/moyu/fe-code"
    >
    </script>
    ```
    `hrs-local`: map to local html file  
    `hrs-root`: node server detect the directory for hot reload.
