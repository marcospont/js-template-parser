import { TextToken, Token } from 'html-tokenizer';
import uniqBy from 'lodash/uniqBy';
import sqlString from 'sqlstring';

import { InvalidParameterException } from '../exceptions';
import { evaluate } from '../parser/expression-parser';
import { TemplateParameters, TemplateParserOptions } from '../types';

const delimExpr = /(#|\$)\{([^}]*)\}/g;
const identifierExpr = /^([A-Z][A-Z0-9_]*)((\.([A-Z0-9_]+))|(\[([A-Z0-9_]+)\]))*$/i;

const replaceVariables = (value: string, params: TemplateParameters, options: TemplateParserOptions): string => {
	const matches = uniqBy(Array.from(value?.matchAll(delimExpr)), '0');

	for (const matchItem of matches) {
		if (matchItem[2] && matchItem[2].match(identifierExpr)) {
			value = value.replaceAll(matchItem[0], formatVariable(evaluate(matchItem[2], params), options, matchItem[1] === '$'));
		} else {
			throw new InvalidParameterException(matchItem[0]);
		}
	}

	return value;
};

const formatVariable = (value: any, options: TemplateParserOptions, raw: boolean): string => {
	if (raw) {
		return value !== null && value !== undefined ? value.toString() : '';
	}
	switch (options.mode) {
		case 'sql':
			return sqlString.escape(value, true);
		default:
			return value !== null && value !== undefined ? value.toString() : '';
	}
};

export default (iterator: IterableIterator<Token>, token: TextToken, params: TemplateParameters, options: TemplateParserOptions): string => {
	return replaceVariables(token.text, params, options);
};
