import isPlainObject from 'lodash/isPlainObject';
import isFunction from 'lodash/isFunction';

import { ExpressionParserException, TemplateParserException } from '../exceptions';
import { ExpressionParserImpl, TemplateParameters, TemplateParserOptions } from '../types';

const ExpressionParser = require('morph-expressions').default;
let expressionParser: ExpressionParserImpl | null;

export const createParser = (options: TemplateParserOptions): void => {
	expressionParser = new ExpressionParser();
	if (isPlainObject(options?.functions)) {
		for (const name in options.functions) {
			if (isFunction(options.functions[name])) {
				expressionParser?.registerFunction(name, options.functions[name]);
			} else {
				throw new TemplateParserException(`Registered function ${name} is not a valid function`);
			}
		}
	}
};

export const evaluate = (expr: string, params: TemplateParameters) => {
	try {
		return expressionParser?.parseAndEval(expr, params);
	} catch (e) {
		if (e instanceof TemplateParserException) {
			throw e;
		} else {
			throw new ExpressionParserException(expr, e as Error);
		}
	}
};
