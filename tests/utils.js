exports.test = function(inCode, outCode)
{
	return ("babel").transform("function a(){" + inCode + "}", {
		plugins: [require('./../')]
	}).code.replace(/\s/g, '') == outCode;
};

