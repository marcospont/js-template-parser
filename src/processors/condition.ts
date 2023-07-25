import { Token, OpeningTagToken } from 'html-tokenizer';

import {
	AttributeValueException,
	MissingAttributeException,
	UnbalancedTagException,
	UnclosedTagException,
	UnexpectedClosingTagException,
	UnexpectedSelfClosingTagException,
	UnknownAttributeException
} from './../exceptions/index';
import { evaluate } from '../parser/expression-parser';
import { TagAttributes, TemplateParameters, TemplateParserOptions } from './../types';
import processors from './';

const knownAttributes = ['test'];
const requiredAttributes = ['test'];

export default (
	iterator: IterableIterator<Token>,
	conditionToken: OpeningTagToken,
	params: TemplateParameters,
	options: TemplateParserOptions,
	stopOnConditionClose = false
): string => {
	const buffer: string[] = [];
	let openingEnd = false;
	let closing = false;
	const attributes: TagAttributes = {};
	let token: IteratorResult<Token>;
	let missingAttribute;
	let conditionResult = undefined;

	token = iterator.next();

	while (!token.done) {
		switch (token.value.type) {
			case 'opening-tag':
				if (conditionResult) {
					buffer.push(processors.tag(iterator, token.value, params, options, true));
				}
				break;
			case 'opening-tag-end':
				if (conditionResult === undefined) {
					if (token.value.token === '/>') {
						throw new UnexpectedSelfClosingTagException(conditionToken.name);
					}
					missingAttribute = requiredAttributes.find(attr => !(attr in attributes));
					if (missingAttribute) {
						throw new MissingAttributeException(conditionToken.name, missingAttribute);
					}
					openingEnd = true;
					conditionResult = !!evaluate(attributes['test'], params);
				}
				break;
			case 'attribute':
				if (conditionResult === undefined) {
					if (!knownAttributes.includes(token.value.name)) {
						throw new UnknownAttributeException(conditionToken.name, token.value.name);
					}
					if (token.value.value.trim() === '') {
						throw new AttributeValueException(conditionToken.name, token.value.name);
					}
					attributes[token.value.name] = token.value.value;
				}
				break;
			case 'closing-tag':
				if (token.value.name !== conditionToken.name) {
					throw new UnexpectedClosingTagException(token.value.name, conditionToken.name);
				}
				closing = true;
				if (stopOnConditionClose) {
					return buffer.join('');
				}
				break;
			case 'comment':
				if (conditionResult && options.preserveComments) {
					buffer.push(`<!--${token.value.text}-->`);
				}
				break;
			case 'text':
				if (conditionResult) {
					buffer.push(processors.variables(iterator, token.value, params, options));
				}
				break;
			case 'done':
				if (!openingEnd) {
					throw new UnclosedTagException(conditionToken.name);
				}
				if (!closing) {
					throw new UnbalancedTagException(conditionToken.name);
				}
				break;
		}
		token = iterator.next();
	}

	return buffer.join('');
};
