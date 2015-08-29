var remap = require('./remap.js').remap;

module.exports = function (params) {
	return new params.Plugin("babel-plugin", {
		visitor: {
			CallExpression: function (node, parent, scope) {
				var t = params.types;
				if (t.isMemberExpression(node.callee) &&
					node.callee.object.name == '_' && node.callee.property.name == 'forEach')
				{
					var indexVar = scope.generateUidIdentifier("i");
					var arrayLengthVar = scope.generateUidIdentifier("l");
					var arrayTempStoreVar = scope.generateUidIdentifier("arrVar");
					var callbackTempStoreVar = scope.generateUidIdentifier("callback");
					var callbackFunctionNode = node.arguments[1];
					var includeIndex = false;
					var includeValue = false;
					var customContext = node.arguments[2];
					var vars = [];

					function getValueExpression()
					{
						return t.MemberExpression(
							arrayTempStoreVar,
							indexVar,
							true
						);
					}

					if (t.isFunctionExpression(callbackFunctionNode))
					{
						var functionBodyClone = callbackFunctionNode.body.__clone();

						var includeValue = !!callbackFunctionNode.params[0];
						if (includeValue)
						{
							functionBodyClone.body.unshift(t.variableDeclaration(
								'let',
								[
									t.assignmentExpression(
										'=',
										callbackFunctionNode.params[0],
										getValueExpression()
									)
								]
							));
						}

						var includeIndex = !!callbackFunctionNode.params[1];
						if (includeIndex)
						{
							functionBodyClone.body.unshift(t.variableDeclaration(
								'let',
								[
									t.assignmentExpression(
										'=',
										callbackFunctionNode.params[1],
										indexVar
									)
								]
							));
						}

						if (customContext)
						{
							functionBodyClone.shadow = true;
							functionBodyClone.shadowMap = functionBodyClone.shadowMap || {};
							functionBodyClone.shadowMap['this'] = customContext;
						}
					}
					else
					{
						if (customContext)
						{
							var functionBodyClone = t.BlockStatement([
								t.callExpression(
									t.MemberExpression(
										callbackTempStoreVar,
										t.Identifier('call')
									),
									[customContext, getValueExpression(), indexVar]
								)
							]);
						}
						else
						{
							var functionBodyClone = t.BlockStatement([
								t.callExpression(
									callbackTempStoreVar,
									[getValueExpression(), indexVar]
								)
							]);
						}

						vars.push(
							t.assignmentExpression(
								'=',
								callbackTempStoreVar,
								callbackFunctionNode
							)
						);
					}

					vars.push(
						t.assignmentExpression(
							'=',
							arrayTempStoreVar,
							node.arguments[0]
						)
					);

					this.replaceWithMultiple([
						t.variableDeclaration(
							'let',
							vars
						),
						t.forStatement(
							t.variableDeclaration(
								'let',
								[
									t.assignmentExpression(
										'=',
										indexVar,
										t.Literal(0)
									),
									t.assignmentExpression(
										'=',
										arrayLengthVar,
										t.MemberExpression(
											arrayTempStoreVar,
											t.Identifier('length')
										)
									)
								]
							),
							t.LogicalExpression('<', indexVar, arrayLengthVar),
							t.UnaryExpression('++', indexVar),
							functionBodyClone
						)
					]);
				}
			},
			ThisExpression: function()
			{
				return remap(this, "this");
			}
		}
	});
}