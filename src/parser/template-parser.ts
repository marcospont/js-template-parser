import { Tokenizer } from 'html-tokenizer';

import { MissingParameterException } from '../exceptions';
import processors from '../processors';
import { TemplateParameters, TemplateParserOptions } from '../types';

export default class TemplateParser {
	static defaultOptions: TemplateParserOptions = {
		mode: 'default',
		throwOnMissingParams: true,
		trim: true,
		preserveComments: true,
		htmlEntities: {}
	};
	parameters: TemplateParameters;
	options: TemplateParserOptions;

	constructor(parameters: TemplateParameters = {}, options: TemplateParserOptions = {}) {
		this.parameters = this.createParametersProxy(parameters);
		this.options = { ...TemplateParser.defaultOptions, ...options };
	}

	setParameters(parameters: TemplateParameters) {
		this.parameters = this.createParametersProxy(parameters);
	}

	clearParameters() {
		this.parameters = this.createParametersProxy({});
	}

	setOptions(options: Partial<TemplateParserOptions>): void {
		this.options = { ...this.options, ...options };
	}

	parseTemplate(template: string): string | null {
		return this.parseContents(template);
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

	private createParametersProxy(params: TemplateParameters): TemplateParameters {
		const { proxy } = Proxy.revocable<TemplateParameters>(params, {
			get: (source: TemplateParameters, prop: string) => {
				if (typeof source[prop] === 'undefined') {
					if (this.options.throwOnMissingParams) {
						throw new MissingParameterException(prop);
					}
					return null;
				}
				return source[prop];
			}
		});

		return proxy;
	}
}
