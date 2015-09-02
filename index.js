var remap = require('./remap.js').remap;
var Immutable = require('immutable');

module.exports = function (params) {
	return new params.Plugin("babel-plugin", {
		visitor: {
			CallExpression: function (node, parent, scope) {
				var t = params.types;
				var genId = scope.generateUidIdentifier.bind(scope);

				function getArrayForLoopReplacement(loopBody, indexVar, arrayTempStoreVar)
				{
					var arrayLengthVar = genId("l");

					return t.forStatement(
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
						loopBody
					);
				}

				function getObjectForInLoopReplacement(loopBody, indexVar, arrayTempStoreVar)
				{
					return	t.forInStatement(
						t.variableDeclaration(
							'let',
							[
								indexVar
							]
						),
						arrayTempStoreVar,
						loopBody
					);
				}

				function getFunctionExpressionLoopBody(loopNode, indexVar, arrayTempStoreVar)
				{
					var functionExprNode = loopNode.arguments[1];
					var loopBodyNode = functionExprNode.body.__clone();

					var valueArgumentUsed = !!functionExprNode.params[0];
					if (valueArgumentUsed)
					{
						loopBodyNode.body.unshift(t.variableDeclaration(
							'let',
							[
								t.assignmentExpression(
									'=',
									functionExprNode.params[0],
									getMemberExpression(indexVar, arrayTempStoreVar)
								)
							]
						));
					}

					var indexArgumentUsed = !!functionExprNode.params[1];
					if (indexArgumentUsed)
					{
						loopBodyNode.body.unshift(t.variableDeclaration(
							'let',
							[
								t.assignmentExpression(
									'=',
									functionExprNode.params[1],
									indexVar
								)
							]
						));
					}

					var customContext = loopNode.arguments[2];
					if (customContext)
					{
						loopBodyNode.shadow = true;
						loopBodyNode.shadowMap = loopBodyNode.shadowMap || {};
						loopBodyNode.shadowMap['this'] = customContext;
					}

					return loopBodyNode;
				}

				function getMemberExpressionLoopBody(loopNode, indexVar, arrayTempStoreVar, callbackTempStoreVar)
				{
					var loopBodyNode;
					var customContext = loopNode.arguments[2];

					if (customContext)
					{
						loopBodyNode = t.BlockStatement([
							t.callExpression(
								t.MemberExpression(
									callbackTempStoreVar,
									t.Identifier('call')
								),
								[customContext, getMemberExpression(indexVar, arrayTempStoreVar), indexVar]
							)
						]);
					}
					else
					{
						loopBodyNode = t.BlockStatement([
							t.callExpression(
								callbackTempStoreVar,
								[getMemberExpression(indexVar, arrayTempStoreVar), indexVar]
							)
						]);
					}

					return loopBodyNode;
				};

				function isArrayLoop(calleeNode)
				{
					return isLoopFor('forEachItem', calleeNode);
				}

				function isObjectLoop(calleeNode)
				{
					return isLoopFor('forEachProp', calleeNode);
				}

				function isLoopFor(iterType, calleeNode)
				{
					return calleeNode.property.name == iterType;
				}

				function addVarInit(vars, varName, value)
				{
					return vars.push(t.assignmentExpression('=', varName, value));
				};

				function getMemberExpression(key, object)
				{
					return t.MemberExpression(object, key, true);
				}

				if (t.isMemberExpression(node.callee) && node.callee.object.name == '_' &&
					(isArrayLoop(node.callee) || isObjectLoop(node.callee)))
				{
					var indexId = genId("i");
					var arrayId = genId("arrVar");
					var callbackId = genId("callback");
					var loopBodyNode;
					var callbackNode = node.arguments[1];
					var outerVars = Immutable.List();

					if (t.isFunctionExpression(callbackNode))
					{
						loopBodyNode = getFunctionExpressionLoopBody(node, indexId, arrayId);
					}
					else
					{
						loopBodyNode = getMemberExpressionLoopBody(node, indexId, arrayId, callbackId);
						outerVars = addVarInit(outerVars, callbackId, callbackNode);
					}

					outerVars = addVarInit(outerVars, arrayId, node.arguments[0]);

					var replacement;
					if (isArrayLoop(node.callee))
					{
						replacement = getArrayForLoopReplacement(loopBodyNode, indexId, arrayId);
					}
					else
					{
						replacement = getObjectForInLoopReplacement(loopBodyNode, indexId, arrayId);
					}

					this.replaceWithMultiple([
						t.variableDeclaration(
							'let',
							outerVars.toArray()
						),
						replacement
					]);
				}
			},
			ThisExpression: function()
			{
				return remap(this, "this");
			}
		}
	});
};