import { OpeningTagToken, Token } from 'html-tokenizer';

import { UnexpectedTagException, UnknownTagException } from '../exceptions';
import { TemplateParameters, TemplateParserOptions } from '../types';
import processors from './';

const knownTags = ['choose', 'foreach', 'if'];
const knownInnerTags: {
	[key: string]: string;
} = {
	when: 'if',
	otherwise: 'if'
};

export default (
	iterator: IterableIterator<Token>,
	tagToken: OpeningTagToken,
	params: TemplateParameters,
	options: TemplateParserOptions,
	stopOnClose = false
): string => {
	let result = '';

	if (!knownTags.includes(tagToken.name)) {
		if (tagToken.name in knownInnerTags) {
			throw new UnexpectedTagException(tagToken.name, knownInnerTags[tagToken.name]);
		} else {
			throw new UnknownTagException(tagToken.name);
		}
	}

	switch (tagToken.name) {
		case 'choose':
			result = processors.choice(iterator, tagToken, params, options, stopOnClose);
			break;
		case 'foreach':
			result = processors.loop(iterator, tagToken, params, options, stopOnClose);
			break;
		case 'if':
			result = processors.condition(iterator, tagToken, params, options, stopOnClose);
			break;
	}

	return result;
};
