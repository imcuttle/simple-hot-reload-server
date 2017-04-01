'use strict';

/**
 * Created by moyu on 2017/3/28.
 */

module.exports = function () {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _ref = arguments[1];
    var app = _ref.app;
    var setUp = config.setUp;

    if (typeof setUp === 'function') {
        setUp(app);
    }
};