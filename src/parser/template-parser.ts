import { Tokenizer } from 'html-tokenizer';

import { MissingParameterException } from '../exceptions';
import processors from '../processors';
import { TemplateParameters, TemplateParserOptions } from '../types';
import { createParametersProxy } from './proxy-builder';

export default class TemplateParser {
	static defaultOptions: TemplateParserOptions = {
		mode: 'default',
		throwOnMissingParams: true,
		collectMissingParams: false,
		trim: true,
		preserveComments: true,
		htmlEntities: {}
	};
	parameters: TemplateParameters;
	options: TemplateParserOptions;
	private missingParams: string[] = [];

	constructor(parameters: TemplateParameters = {}, options: TemplateParserOptions = {}) {
		this.parameters = createParametersProxy(parameters, this, prop => this.missingParams.push(prop));
		this.options = { ...TemplateParser.defaultOptions, ...options };
	}

	setParameters(parameters: TemplateParameters) {
		this.parameters = createParametersProxy(parameters, this, prop => this.missingParams.push(prop));
	}

	clearParameters() {
		this.parameters = createParametersProxy({}, this, prop => this.missingParams.push(prop));
	}

	setOptions(options: Partial<TemplateParserOptions>): void {
		this.options = { ...this.options, ...options };
	}

	parseTemplate(template: string): string | null {
		let parseResult = null;

		this.missingParams = [];
		parseResult = this.parseContents(template);

		if (this.options.collectMissingParams && this.missingParams.length > 0) {
			throw new MissingParameterException(this.missingParams);
		}

		return parseResult;
	}

	private parseContents(template: string): string | null {
		const buffer: string[] = [];
		const tokenizer = Tokenizer.from({ entities: this.options.htmlEntities });
		const iterator = tokenizer.tokenize(template);
		let token = iterator.next();

		while (!token.done) {
			switch (token.value.type) {
				case 'start':
					break;
				case 'comment':
					if (this.options.preserveComments) {
						buffer.push(`<!--${token.value.text}-->`);
					}
					break;
				case 'text':
					buffer.push(processors.variables(iterator, token.value, this.parameters, this.options));
					break;
				case 'opening-tag':
					buffer.push(processors.tag(iterator, token.value, this.parameters, this.options, true));
					break;
				case 'done':
					break;
			}
			token = iterator.next();
		}

		return this.options.trim ? buffer.join('').trim() : buffer.join('');
	}
}
