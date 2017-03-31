# Simple Hot Reload Server

Set up a server for frontend files(html/css/js/favicon) & Watch frontend files.

connected server and client by WebSocket.

*Important: Only support files which filename ends with `.html/.htm` or is required by html/htm*


**Hot Reload**
![](https://ooo.0o0.ooo/2017/03/31/58de5c97bfa0b.jpg)

**Debugger**
![](https://ooo.0o0.ooo/2017/03/31/58de5c83f0eac.jpg)


```bash
npm install -g simple-hot-reload-server
```

```text
Usage: hrs [-p port] path

Options:

  -v --version                get current version.
  -p --port                   set port of server.(default: 8082)
  -h --help                   how to use it.
```

## Feature

**Support Local Server**
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
1. set up an node server
    ```bash
    hrs
    ```
2. insert script in HTML manually.
    ```html
    <script
        src="http://localhost:8082/__hrs__/client-script.js"
        hrs-local="/Users/moyu/fe-code/a/b/jsonp.html"
        hrs-root="/Users/moyu/fe-code"
    >
    </script>
    ```
    `hrs-local`: map to local html file  
    `hrs-root`: node server detect the directory for hot reload.