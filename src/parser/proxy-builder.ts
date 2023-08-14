import { MissingParameterException } from '../exceptions';
import { TemplateParameters } from '../types';
import TemplateParser from './template-parser';

export const createParametersProxy = (
	params: TemplateParameters,
	parser: TemplateParser,
	addMissingProp: (prop: string) => void
): TemplateParameters => {
	const { proxy } = Proxy.revocable<TemplateParameters>(params, {
		get: (source: TemplateParameters, prop: string) => {
			if (isScalar(source[prop]) || isSymbol(prop)) {
				return source[prop];
			}
			if (typeof source[prop] === 'undefined') {
				if (parser.options.throwOnMissingParams) {
					throw new MissingParameterException(prop);
				}
				if (parser.options.collectMissingParams) {
					addMissingProp(prop);
				}
				return null;
			}
			return createNestedProxy(source[prop], prop, parser, addMissingProp);
		}
	});

	return proxy;
};

const createNestedProxy = (nestedParam: any, parentProp: string, parser: TemplateParser, addMissingProp: (prop: string) => void): any => {
	const { proxy } = Proxy.revocable<any>(nestedParam, {
		get: (source: any, prop: string) => {
			if (isScalar(source[prop]) || isSymbol(prop)) {
				return source[prop];
			}
			if (typeof nestedParam[prop] === 'undefined') {
				if (parser.options.throwOnMissingParams) {
					throw new MissingParameterException(`${parentProp}.${prop}`);
				}
				if (parser.options.collectMissingParams) {
					addMissingProp(`${parentProp}.${prop}`);
				}
				return null;
			}
			return createNestedProxy(source[prop], `${parentProp}.${prop}`, parser, addMissingProp);
		}
	});

	return proxy;
};

const isScalar = (value: any) => {
	return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null;
};

const isSymbol = (value: any) => {
	return String(value) === String(Symbol.toStringTag) || String(value) === String(Symbol.iterator);
};
