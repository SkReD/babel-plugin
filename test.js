var babel = require('babel');

console.log(require("babel").transform("function a(){_.forEachProp([1,2], function(v, i){ return this.a + i})}", {
	plugins: [require('./../babel-plugin')]
}).code);