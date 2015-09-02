
var assert = require('assert');
var babel = require('babel');

function getBabelOutput(code)
{
	return babel.transform("function a(){" + code + "}", {
			plugins: [require('./../')]
		}).code.replace(/\n/g, '').replace(/\s+/g, ' ');
}

suite('forEachItem', function()
{
	test('anonymous function', function() {
		assert.equal(getBabelOutput('_.forEachItem([1,2], function(v, i){ return v + i})'),
			'"use strict";function a() { var _arrVar = [1, 2]; for (var _i2 = 0, _l2 = _arrVar.length; _i2 < _l2; ++_i2) { var i = _i2; var v = _arrVar[_i2]; return v + i; }}');
	});

	test('member expression function', function() {
		assert.equal(getBabelOutput('_.forEachItem([1,2], obj.DoThing)'),
			'"use strict";function a() { var _callback = obj.DoThing, _arrVar = [1, 2]; for (var _i2 = 0, _l2 = _arrVar.length; _i2 < _l2; ++_i2) { _callback(_arrVar[_i2], _i2) }}');
	});

	test('anonymous function and context', function() {
		assert.equal(getBabelOutput('_.forEachItem([1,2], function(v, i){ return this.a + i}, self)'),
			'"use strict";function a() { var _arrVar = [1, 2]; for (var _i2 = 0, _l2 = _arrVar.length; _i2 < _l2; ++_i2) { var i = _i2; var v = _arrVar[_i2]; return self.a + i; }}');
	});

	test('member expression function and context', function() {
		assert.equal(getBabelOutput('_.forEachItem([1,2], obj.DoThing, self)'),
			'"use strict";function a() { var _callback = obj.DoThing, _arrVar = [1, 2]; for (var _i2 = 0, _l2 = _arrVar.length; _i2 < _l2; ++_i2) { _callback.call(self, _arrVar[_i2], _i2) }}');
	});
});

suite('forEachProp', function()
{
	test('anonymous function', function() {
		assert.equal(getBabelOutput('_.forEachProp([1,2], function(v, i){ return v + i})'),
			'"use strict";function a() { var _arrVar = [1, 2]; for (var _i2 in _arrVar) { var i = _i2; var v = _arrVar[_i2]; return v + i; }}');
	});

	test('member expression function', function() {
		assert.equal(getBabelOutput('_.forEachProp({a: 1, b: 2}, obj.DoThing)'),
			'"use strict";function a() { var _callback = obj.DoThing, _arrVar = { a: 1, b: 2 }; for (var _i2 in _arrVar) { _callback(_arrVar[_i2], _i2) }}');
	});

	test('anonymous function and context', function() {
		assert.equal(getBabelOutput('_.forEachProp({a: 1, b: 2}, function(v, i){ return this.a + i}, self)'),
			'"use strict";function a() { var _arrVar = { a: 1, b: 2 }; for (var _i2 in _arrVar) { var i = _i2; var v = _arrVar[_i2]; return self.a + i; }}');
	});

	test('member expression function and context', function() {
		assert.equal(getBabelOutput('_.forEachProp({a: 1, b: 2}, obj.DoThing, self)'),
			'"use strict";function a() { var _callback = obj.DoThing, _arrVar = { a: 1, b: 2 }; for (var _i2 in _arrVar) { _callback.call(self, _arrVar[_i2], _i2) }}');
	});
});