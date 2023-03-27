import { OpeningTagToken, Token } from 'html-tokenizer';

import {
	AttributeValueException,
	MissingAttributeException,
	TemplateParserException,
	UnbalancedTagException,
	UnclosedTagException,
	UnexpectedAttributeException,
	UnexpectedClosingTagException,
	UnexpectedSelfClosingTagException,
	UnexpectedTagException,
	UnknownAttributeException
} from './../exceptions';
import { evaluate } from '../parser/expression-parser';
import { TagAttributes, TemplateParameters, TemplateParserOptions } from '../types';
import processors from './';

const knownWhenAttributes = ['test'];
const requiredWhenAttributes = ['test'];

export default (
	iterator: IterableIterator<Token>,
	choiceToken: OpeningTagToken,
	params: TemplateParameters,
	options: TemplateParserOptions,
	stopOnChoiceClose = false
): string => {
	const buffer: string[] = [];
	let token: IteratorResult<Token>;
	let currentTag: string = choiceToken.name;
	let currentCondition: {
		count: number;
		attributes: TagAttributes;
		satisfied: boolean;
	} | null = null;
	let conditionCount = 0;
	let hasOtherwise = false;
	let missingAttribute;
	let state = 'choose-open';

	token = iterator.next();

	while (!token.done) {
		switch (token.value.type) {
			case 'opening-tag':
				if (token.value.name === 'when') {
					if (hasOtherwise) {
						throw new TemplateParserException('The when tags must be declared before the otherwise tag');
					}
					currentTag = token.value.name;
					conditionCount++;
					state = 'when-open';
					if (currentCondition?.satisfied) {
						break;
					} else {
						currentCondition = {
							count: conditionCount,
							attributes: {},
							satisfied: false
						};
					}
				} else if (token.value.name === 'otherwise') {
					if (hasOtherwise) {
						throw new TemplateParserException('A choose tag can have only one otherwise tag');
					} else if (!currentCondition) {
						throw new TemplateParserException('Otherwise tag found with no previous when tags');
					}
					currentTag = token.value.name;
					state = 'otherwise-open';
					hasOtherwise = true;
					if (currentCondition?.satisfied) {
						break;
					}
				} else if (state === 'when-open-end') {
					if (currentCondition!.satisfied) {
						buffer.push(processors.tag(iterator, token.value, params, options, true));
					}
				} else if (state === 'otherwise-open-end') {
					if (!currentCondition!.satisfied) {
						buffer.push(processors.tag(iterator, token.value, params, options, true));
					}
				} else {
					throw new UnexpectedTagException(token.value.name, choiceToken.name, true);
				}
				break;
			case 'opening-tag-end':
				if (token.value.token === '/>') {
					throw new UnexpectedSelfClosingTagException(currentTag);
				}
				state = `${token.value.name}-open-end`;
				if (currentCondition?.satisfied) {
					break;
				}
				if (token.value.name === 'when') {
					missingAttribute = requiredWhenAttributes.find(attr => !(attr in currentCondition!.attributes));
					if (missingAttribute) {
						throw new MissingAttributeException('when', missingAttribute);
					}
					currentCondition!.satisfied = !!evaluate(currentCondition!.attributes['test'], params);
				}
				break;
			case 'attribute':
				if (currentTag === 'when') {
					if (currentCondition?.satisfied) {
						break;
					} else if (!knownWhenAttributes.includes(token.value.name)) {
						throw new UnknownAttributeException('when', token.value.name);
					} else if (token.value.value.trim() === '') {
						throw new AttributeValueException('when', token.value.name);
					}
					currentCondition!.attributes[token.value.name] = token.value.value;
				} else {
					throw new UnexpectedAttributeException(currentTag);
				}
				break;
			case 'closing-tag':
				if (token.value.name !== currentTag) {
					throw new UnexpectedClosingTagException(token.value.name, currentTag);
				} else if (!currentCondition && token.value.name === 'choose') {
					throw new TemplateParserException('A choose tag must have at least one when tag');
				}
				state = `${token.value.name}-close`;
				if (currentTag === 'when' || currentTag === 'otherwise') {
					currentTag = choiceToken.name;
				}
				if (state === 'choose-close' && stopOnChoiceClose) {
					return buffer.join('');
				}
				break;
			case 'comment':
				if (
					(state === 'when-close' ||
						state === 'otherwise-open-end' ||
						(state === 'when-open-end' && conditionCount !== currentCondition?.count)) &&
					currentCondition?.satisfied
				) {
					break;
				}
				if (state === 'when-open-end') {
					if (currentCondition!.satisfied && options.preserveComments) {
						buffer.push(`<!--${token.value.text}-->`);
					}
				} else if (state === 'otherwise-open-end') {
					if (!currentCondition!.satisfied && options.preserveComments) {
						buffer.push(`<!--${token.value.text}-->`);
					}
				} else {
					throw new TemplateParserException(`Unexpected comment: ${token.value.text}`);
				}
				break;
			case 'text':
				if (
					(state === 'when-close' ||
						state === 'otherwise-open-end' ||
						(state === 'when-open-end' && conditionCount !== currentCondition?.count)) &&
					currentCondition?.satisfied
				) {
					break;
				}
				if (state === 'when-open-end') {
					if (currentCondition!.satisfied) {
						buffer.push(processors.variables(iterator, token.value, params, options));
					}
				} else if (state === 'otherwise-open-end') {
					if (!currentCondition!.satisfied) {
						buffer.push(processors.variables(iterator, token.value, params, options));
					}
				} else {
					if (token.value.text.trim() !== '') {
						throw new TemplateParserException(`Unexpected text content: ${token.value.text}`);
					} else {
						buffer.push(token.value.text);
					}
				}
				break;
			case 'done':
				if (state === 'choose-open' || state === 'when-open' || state === 'otherwise-open') {
					throw new UnclosedTagException(currentTag);
				} else if (state === 'choose-open-end' || state === 'when-open-end' || state === 'otherwise-open-end') {
					throw new UnbalancedTagException(currentTag);
				} else if (state === 'when-close' || state === 'otherwise-close') {
					throw new UnbalancedTagException(choiceToken.name);
				}
				break;
		}
		token = iterator.next();
	}

	return buffer.join('');
};
