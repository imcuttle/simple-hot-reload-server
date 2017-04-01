/**
 * Created by moyu on 2017/4/1.
 */
const path = require('path');
const url = require('url');
const fs = require('fs');
const helper = require('./helpers');


const getFilesStatPromise = (dirname) => {
    return helper.readDirPromise(dirname)
        .then(files =>
            Promise.all(
                files.map(
                    (name) => helper.statPromise(path.join(dirname, name))
                        .then(stat => ({
                            type: stat.isFile() ? "File": "Directory",
                            size: stat.isFile() ? stat.size.toSize() : "-",
                            name,
                            mtime: new Date(stat.mtime).format(),
                            ctime: new Date(stat.ctime).format(),
                        }))
                )
            )
        );
}



module.exports = function (options) {
    const {route, root, app, redirect= false} = options;
    return function (req, res, next) {
        const error = (error) => res.send(error);

        const renderDirPage = (filename, files) => {
            fs.readFile(path.join(__dirname, "static/css/entry.css"), (err, data) => {
                if (err) {
                    error(err);
                } else {
                    filename = filename == '' ? '/' : filename;
                    res.render('directory', {title: filename, path: filename, files, route, style: data.toString()});
                }
            })
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
        const absolutePath = path.resolve(root);
        // const relativePath = path.resolve(root);
        let {pathname} = url.parse(req.url);
        pathname = pathname.replace(new RegExp(`^${route}`), '').trim();
        pathname = pathname == '' ? '/' : pathname;
        const filename = path.join(absolutePath, pathname);
        // console.log(pathname);
        switch (pathname) {
            case '/': {
                // root
                getFilesStatPromise(filename)
                .then(list => {
                    renderDirPage(pathname, list);
                }).catch(error);
                break;
            }
            default: {
                helper.statPromise(filename)
                    .then(stat => {
                        if (stat.isDirectory()) {
                            return getFilesStatPromise(filename)
                                .then(list => {
                                    let parent = path.dirname(filename);
                                    let parentStat = fs.statSync(parent);
                                    list.unshift({
                                        type: "Directory",
                                        size: "-",
                                        name: "..",
                                        mtime: new Date(parentStat.mtime).format(),
                                        ctime: new Date(parentStat.ctime).format(),
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
                    })
                    .catch(error)
            }
        }

    }
};