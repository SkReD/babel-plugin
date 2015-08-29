/**
 * [Please add a description.]
 */
function inShadow(path, key) {
	do {
		if (path.node)
		{
			var shadow = path.node.shadow;
			if (shadow)
			{
				// this is because sometimes we may have a `shadow` value of:
				//
				//   { this: false }
				//
				// we need to catch this case if `inShadow` has been passed a `key`
				if (!key || shadow[key] !== false)
				{
					return path;
				}
			}

			if (path.isFunction())
			{
				// normal function, we've found our function context
				return null;
			}
		}
	} while (path = path.parentPath);
	return null;
}

exports.remap = function(path, key) {
	// ensure that we're shadowed
	var shadowPath = inShadow(path, key);

	if (shadowPath)
	{
		return shadowPath.node.shadowMap[key];
	}
};