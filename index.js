module.exports = function (params) {
	return new params.Plugin("forEach_plugin", {
		visitor: {
			CallExpression: function (node, parent, scope) {
				var t = params.types;
				if (t.isMemberExpression(node.callee) &&
					node.callee.object.name == '_' && node.callee.property.name == 'forEach')
				{
					var indexVar = scope.generateUidIdentifier("i");
					var arrayLengthVar = scope.generateUidIdentifier("l");
					var arrayTempStoreVar = scope.generateUidIdentifier("arrVar");
					var callbackFunctionNode = node.arguments[1];
					var functionBodyClone = node.arguments[1].body.__clone();

					if (callbackFunctionNode.params)
					{
						if (callbackFunctionNode.params[0])
						{
							functionBodyClone.body.unshift(t.variableDeclaration(
								'let',
								[
									t.assignmentExpression(
										'=',
										callbackFunctionNode.params[0],
										t.MemberExpression(
											arrayTempStoreVar,
											indexVar,
											true
										)
									)
								]
							))
						}

						if (callbackFunctionNode.params[1])
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
							))
						}
					}

					this.replaceWithMultiple([
						t.variableDeclaration(
							'let',
							[
								t.assignmentExpression(
									'=',
									arrayTempStoreVar,
									node.arguments[0]
								)
							]
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
									),
								]
							),
							t.LogicalExpression('<', indexVar, arrayLengthVar),
							t.UnaryExpression('++', indexVar),
							functionBodyClone
						)
					]);
				}
			}
		}
	});
}