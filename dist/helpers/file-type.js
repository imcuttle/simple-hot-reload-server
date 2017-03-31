"use strict";

/**
 * Created by moyu on 2017/3/28.
 */
var isHTML = function isHTML(filename) {
  return (/\.(html|htm)$/.test(filename)
  );
};

module.exports = {
  isHTML: isHTML
};