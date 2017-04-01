'use strict';

/**
 * Created by moyu on 2017/4/1.
 */
var path = require('path');
var url = require('url');
var fs = require('fs');
var helper = require('./helpers');

var getFilesStatPromise = function getFilesStatPromise(dirname) {
    return helper.readDirPromise(dirname).then(function (files) {
        return Promise.all(files.map(function (name) {
            return helper.statPromise(path.join(dirname, name)).then(function (stat) {
                return {
                    type: stat.isFile() ? "File" : "Directory",
                    size: stat.isFile() ? stat.size.toSize() : "-",
                    name: name,
                    mtime: new Date(stat.mtime).format(),
                    ctime: new Date(stat.ctime).format()
                };
            });
        }));
    });
};

module.exports = function (options) {
    var route = options.route,
        root = options.root,
        app = options.app,
        _options$redirect = options.redirect,
        redirect = _options$redirect === undefined ? false : _options$redirect;

    return function (req, res, next) {
        var error = function error(_error) {
            return res.send(_error);
        };

        var renderDirPage = function renderDirPage(filename, files) {
            fs.readFile(path.join(__dirname, "static/css/entry.css"), function (err, data) {
                if (err) {
                    error(err);
                } else {
                    filename = filename == '' ? '/' : filename;
                    res.render('directory', { title: filename, path: filename, files: files, route: route, style: data.toString() });
                }
            });
        };

        if (!app.__file_flag__) {
            app.set('views', path.join(__dirname, 'views'));
            app.set('view engine', 'pug');
            app.__file_flag__ = true;
        }

        if (!req.originalUrl.startsWith(route)) {
            next();
            return;
        }
        var absolutePath = path.resolve(root);
        // const relativePath = path.resolve(root);

        var _url$parse = url.parse(req.url),
            pathname = _url$parse.pathname;

        pathname = pathname.replace(new RegExp('^' + route), '').trim();
        pathname = pathname == '' ? '/' : pathname;
        var filename = path.join(absolutePath, pathname);
        // console.log(pathname);
        switch (pathname) {
            case '/':
                {
                    // root
                    getFilesStatPromise(filename).then(function (list) {
                        renderDirPage(pathname, list);
                    }).catch(error);
                    break;
                }
            default:
                {
                    helper.statPromise(filename).then(function (stat) {
                        if (stat.isDirectory()) {
                            return getFilesStatPromise(filename).then(function (list) {
                                var parent = path.dirname(filename);
                                var parentStat = fs.statSync(parent);
                                list.unshift({
                                    type: "Directory",
                                    size: "-",
                                    name: "..",
                                    mtime: new Date(parentStat.mtime).format(),
                                    ctime: new Date(parentStat.ctime).format()
                                });

                                renderDirPage(pathname, list);
                            }).catch(error);
                        } else {
                            if (redirect) {
                                res.redirect(pathname);
                            } else {
                                res.sendFile(filename);
                            }
                        }
                    }).catch(error);
                }
        }
    };
};