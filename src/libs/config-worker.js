/**
 * Created by moyu on 2017/3/28.
 */

module.exports = function (config={}, {app}) {
    const {setUp} = config;
    if (typeof setUp === 'function') {
        setUp(app);
    }
}

