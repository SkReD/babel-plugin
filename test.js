var babel = require('babel');

console.log(require("babel").transform("function a(){_.forEach([1,2], (v, i) => { return this.a + i}, self)}", {
	plugins: [require('./../babel-plugin')]
}).code);