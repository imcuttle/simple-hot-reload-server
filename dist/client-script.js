'use strict';

/**
 * Created by moyu on 2017/3/28.
 */

!function (DATA) {
    var query = location.search;
    var dataHrsLocalScript = document.querySelector('script[hrs-local]');
    if (dataHrsLocalScript) {
        DATA = DATA || {};
        if (!DATA.port) {
            var src = dataHrsLocalScript.getAttribute('src');
            var mather = src.match(/[^\?]+:(\d+)/);
            query = src.split('?')[1];
            if (mather.length >= 2) {
                DATA.port = mather[1];
            } else {
                DATA.port = 80;
            }
        }
    }

    function _refreshCSS(hrefs, force) {
        hrefs = hrefs || [];
        hrefs = hrefs.map(function (href) {
            return href.trim();
        });
        var refresh = false;
        var sheets = [].slice.call(document.getElementsByTagName("link"));
        var head = document.getElementsByTagName("head")[0];
        for (var i = 0; i < sheets.length; ++i) {
            var elem = sheets[i];
            var rel = elem.rel;
            var href = elem.getAttribute("href");
            var pureHref = href.replace(/\?[\s\S]*$/, '');

            if (!force) {
                var index = hrefs.indexOf(pureHref.trim());
                if (index < 0) {
                    continue;
                }
            }

            if (rel.toLowerCase() == "stylesheet" && pureHref.endsWith(".css")) {
                var url = href.replace(/(&|\?)_cacheOverride=\d+/, '');
                elem.setAttribute('href', url + (url.indexOf('?') >= 0 ? '&' : '?') + '_cacheOverride=' + new Date().valueOf());
            }

            // Do not change the order of stylesheet
            // head.removeChild(elem);
            // head.appendChild(elem);
            refresh = true;
        }

        if (!refresh) {
            _refreshCSS([], true);
        }
    }

    function getRegisterData() {
        if (dataHrsLocalScript) {
            var root = dataHrsLocalScript.getAttribute('hrs-root');
            return {
                type: 'cors',
                value: dataHrsLocalScript.getAttribute('hrs-local'),
                root: root && root.trim()
            };
        } else {
            return {
                type: 'same-origin',
                value: location.pathname
            };
        }
    }

    var PREFIX = '[HRS] ';
    var methods = {
        error: function error(message) {
            var sender = debug ? console.__origin__.error : console.error;
            sender.call(console, new Error(PREFIX + message));
        },
        log: function log(message) {
            var sender = debug ? console.__origin__.log : console.log;
            sender.call(console, PREFIX + message);
        },
        reload: function reload() {
            location.reload();
        },
        refreshCSS: function refreshCSS(hrefs) {
            _refreshCSS(hrefs);
        }
    };

    if (!DATA) {
        methods.error('The global data has not existed!');
    }

    var send = function send(data, type) {

        type = type || 'log';
        connect_socket && connect_socket.readyState === WebSocket.OPEN && connect_socket.send(JSON.stringify({ type: type, data: data }));
    };

    window.hrs_send = window.hrs_send || send;

    var connect_timer = null;
    var connect_socket = null;

    function connect() {
        if (connect_socket != null) {
            connect_socket.close();
            connect_socket = null;
        }

        connect_socket = new WebSocket("ws://" + location.hostname + ":" + DATA.port);
        var socket = connect_socket;

        // Connection opened
        socket.addEventListener('open', function (event) {
            if (connect_timer != null) {
                clearInterval(connect_timer);
            }
            socket.send(JSON.stringify({
                type: 'register', data: getRegisterData() //location.pathname
            }));
        });

        socket.addEventListener('close', function (event) {
            if (connect_timer != null) {
                return;
            }
            connect_timer = setInterval(function () {
                connect();
            }, 2000);
        });

        socket.addEventListener('error', function (error) {
            socket.close();
        });

        // Listen for messages
        socket.addEventListener('message', function (event) {
            var data = JSON.parse(event.data);
            if (Object.prototype.toString.call(data.type) !== '[object Array]') {
                data.type = [data.type];
                data.data = [data.data];
            }

            data.type.forEach(function (name, index) {
                try {
                    methods[name](data.data[index]);
                } catch (ex) {
                    alert('[HRS]: ' + ex.stack);
                }
            });
        });
    }

    connect();

    function getQueryJson(query) {
        query = query.trim();
        if (query[0] == '?') {
            query = query.substr(1);
        }

        var kvStrs = query.split('&');
        var queryJson = {};
        kvStrs.map(function (kv) {
            kv = kv.split('=');
            queryJson[kv[0]] = kv[1];
        });
        return queryJson;
    }

    /* query string tag ?debug=true&reload=false */
    var debug = false;

    if (query) {
        var queryJson = getQueryJson(query);
        if (queryJson['debug'] && queryJson['debug'] != 'false') {
            debug = true;
            debugEntry();
        }
        if (queryJson['reload'] == 'false') {
            methods.reload = function () {};
            methods.refreshCSS = function () {};
        }
    }

    function debugEntry() {

        function overConsoleMethod(name) {
            var originMethod = console.__origin__[name] = console[name];
            if (typeof originMethod === 'function') {
                console[name] = function () {
                    var args = [].slice.call(arguments).map(function (arg) {
                        if (arg instanceof Error) {
                            return arg.stack;
                        }
                        return arg;
                    });
                    send(args, name);
                    originMethod.apply(this, arguments);
                };
            }
        }

        Object.keys(console).forEach(function (k) {
            console.__origin__ = console.__origin__ || {};
            console.__origin__[k] = console[k];
            overConsoleMethod(k);
        });

        var origin = console.__origin__;
        if (!origin['log']) {
            overConsoleMethod('log');
        }
        if (!origin['error']) {
            overConsoleMethod('error');
        }
        if (!origin['info']) {
            overConsoleMethod('info');
        }
        if (!origin['dir']) {
            overConsoleMethod('dir');
        }

        window.addEventListener('error', function (evt) {
            console.error(evt.error);
        });
    }
}(window.__HRS_DATA__);