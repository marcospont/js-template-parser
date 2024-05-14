import { OpeningTagToken, Token, TextToken } from 'html-tokenizer';
import last from 'lodash/last';

import {
	AttributeValueException,
	InvalidParameterException,
	MissingAttributeException,
	UnbalancedTagException,
	UnclosedTagException,
	UnexpectedClosingTagException,
	UnexpectedSelfClosingTagException,
	UnknownAttributeException
} from '../exceptions';
import { evaluate } from '../parser/expression-parser';
import processors from '../processors';
import { LoopAttributes, TemplateParameters, TemplateParserOptions } from '../types';

const isIterable = require('is-iterable');
const knownAttributes = ['collection', 'item', 'index', 'open', 'close', 'separator', 'trim'];
const requiredAttributes = ['collection'];

const attributeValidator = (name: string, val: string, params: TemplateParameters): string | any[] | boolean => {
	switch (name) {
		case 'collection':
			if (!(val in params)) {
				throw new InvalidParameterException(val);
			} else if (!isIterable(params[val])) {
				throw new AttributeValueException('foreach', name, 'iterable');
			}
			return params[val];
		case 'item':
		case 'index':
			if (!val.match(/^[A-Z][A-Z0-9_]*$/i)) {
				throw new AttributeValueException('foreach', name, 'word boundary characters');
			}
			return val;
		case 'trim':
			if (!val.match(/^(true|false)$/)) {
				throw new AttributeValueException('foreach', name, 'true or false');
			}
			return evaluate(val, params);
		default:
			return val;
	}
};

const collectLoopTokens = (iterator: IterableIterator<Token>, startToken: IteratorResult<Token>): Token[] => {
	const result = [startToken.value];
	let token = iterator.next();

	while (!token.done) {
		switch (token.value.type) {
			case 'closing-tag':
				result.push(token.value);
				if (token.value.name === 'foreach') {
					return result;
				}
				break;
			case 'done':
				result.push(token.value);
				break;
			default:
				result.push(token.value);
				break;
		}
		token = iterator.next();
	}

	return result;
};

const processLoopIteration = (iterator: IterableIterator<Token>, params: TemplateParameters, options: TemplateParserOptions): string => {
	const buffer: string[] = [];
	let token = iterator.next();

	while (!token.done) {
		switch (token.value.type) {
			case 'comment':
				if (options.preserveComments) {
					buffer.push(`<!--${token.value.text}-->`);
				}
				break;
			case 'text':
				buffer.push(processors.variables(iterator, token.value, params, options));
				break;
			case 'opening-tag':
				buffer.push(processors.tag(iterator, token.value, params, options, true));
				break;
			case 'done':
				break;
		}
		token = iterator.next();
	}

	return buffer.join('');
};

const processLoopContent = (
	iterator: IterableIterator<Token>,
	startToken: IteratorResult<Token>,
	attributes: LoopAttributes,
	params: TemplateParameters,
	options: TemplateParserOptions
): [string, Token] => {
	let index = 0;
	const buffer: string[] = [];
	const tokens: Token[] = collectLoopTokens(iterator, startToken);
	function* generator(): IterableIterator<Token> {
		for (let i = 0; i < tokens.length; i++) {
			yield tokens[i];
		}
	}

	for (const item of attributes.collection as string | any[]) {
		const itemParams = { ...params, ...{ [attributes.item as string]: item, [attributes.index as string]: index } };
		const itemOutput = processLoopIteration(generator(), itemParams, options);

		buffer.push(attributes.trim ? itemOutput.trim() : itemOutput);
		index++;
	}

	return [`${attributes.open}${buffer.join(attributes.separator as string)}${attributes.close}`, last(tokens) as Token];
};

export default (
	iterator: IterableIterator<Token>,
	loopToken: OpeningTagToken,
	params: TemplateParameters,
	options: TemplateParserOptions,
	stopOnLoopClose = false
): string => {
	const buffer: string[] = [];
	let openingEnd = false;
	let closing = false;
	const attributes: LoopAttributes = {
		item: 'item',
		index: 'index',
		open: '',
		close: '',
		separator: '',
		trim: false
	};
	let token: IteratorResult<Token>;
	let missingAttribute;
	let content: string;
	let lastToken: Token;

	token = iterator.next();

	while (!token.done) {
		switch (token.value.type) {
			case 'opening-tag':
			case 'comment':
			case 'text':
				if (!closing) {
					[content, lastToken] = processLoopContent(iterator, token, attributes, params, options);
					buffer.push(content);
					token = {
						value: lastToken,
						done: false
					};
					continue;
				} else if (token.value.type === 'opening-tag') {
					buffer.push(processors.tag(iterator, token.value, params, options, true));
				} else if (token.value.type === 'comment' && options.preserveComments) {
					buffer.push(`<!--${token.value.text}-->`);
				} else if (token.value.type === 'text') {
					buffer.push(processors.variables(iterator, token.value as TextToken, params, options));
				}
				break;
			case 'opening-tag-end':
				if (token.value.token === '/>') {
					throw new UnexpectedSelfClosingTagException(loopToken.name);
				}
				missingAttribute = requiredAttributes.find(attr => !(attr in attributes));
				if (missingAttribute) {
					throw new MissingAttributeException(loopToken.name, missingAttribute);
				}
				openingEnd = true;
				break;
			case 'attribute':
				if (!knownAttributes.includes(token.value.name)) {
					throw new UnknownAttributeException(loopToken.name, token.value.name);
				}
				if (token.value.value.trim() === '') {
					throw new AttributeValueException(loopToken.name, token.value.name);
				}
				attributes[token.value.name] = attributeValidator(token.value.name, token.value.value, params);
				break;
			case 'closing-tag':
				if (token.value.name !== loopToken.name) {
					throw new UnexpectedClosingTagException(token.value.name, loopToken.name);
				}
				closing = true;
				if (stopOnLoopClose) {
					return buffer.join('');
				}
				break;
			case 'done':
				if (!openingEnd) {
					throw new UnclosedTagException(loopToken.name);
				}
				if (!closing) {
					throw new UnbalancedTagException(loopToken.name);
				}
				break;
		}
		token = iterator.next();
	}

	return buffer.join('');
};
