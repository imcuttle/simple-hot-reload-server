"use strict";

/**
 * Created by moyu on 2017/4/1.
 */

Date.prototype.format = function (fmt) {
    //author: meizz
    fmt = fmt || 'yyyy/MM/dd hh:mm';
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    }return fmt;
};

Number.prototype.toSize = function () {
    if (this < 1024) {
        return this + "B";
    } else if (this < 1024 << 10) {
        return (this / 1024).toFixed(2) + "KB";
    } else if (this < 1024 << 20) {
        return (this / (1024 << 10)).toFixed(2) + "MB";
    } else {
        return (this / (1024 << 20)).toFixed(2) + "GB";
    }
};

exports.readDirPromise = require('./readdir-promise');
exports.statPromise = require('./stat-promise');