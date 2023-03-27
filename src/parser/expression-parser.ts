import { ExpressionParserException, TemplateParserException } from '../exceptions';
import { TemplateParameters } from '../types';

const ExpressionParser = require('morph-expressions').default;
const expressionParser = new ExpressionParser();

export const evaluate = (expr: string, params: TemplateParameters) => {
	try {
		return expressionParser.parseAndEval(expr, params);
	} catch (e) {
		if (e instanceof TemplateParserException) {
			throw e;
		} else {
			throw new ExpressionParserException(expr, e as Error);
		}
	}
};
