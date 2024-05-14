import { TemplateParserException, UnexpectedTagException, UnknownTagException } from '../src/exceptions';
import TemplateParser from '../src/parser/template-parser';

describe('Parser', () => {
	const parser = new TemplateParser();

	afterEach(() => {
		parser.clearParameters();
		parser.setOptions(TemplateParser.defaultOptions);
	});

	it('must return an empty string for an empty template', () => {
		expect(parser.parseTemplate('')).toBe('');
	});

	it('must trim the output depending on a parser option', () => {
		parser.setOptions({
			trim: true
		});
		expect(parser.parseTemplate(' ')).toBe('');
		parser.setOptions({
			trim: false
		});
		expect(parser.parseTemplate(' ')).toBe(' ');
	});

	it('must throw an exception for unknown tags', () => {
		expect(() => {
			parser.parseTemplate('<script>');
		}).toThrow(UnknownTagException);
	});

	it('must throw an exception for tags only valid within another tag', () => {
		expect(() => {
			parser.parseTemplate('<when>');
		}).toThrow(UnexpectedTagException);
	});

	it('must throw an exception for invalid functions passed in the parser options', () => {
		parser.setParameters({
			param1: 'foo'
		});
		parser.setOptions({
			functions: {
				func: 'bar' as unknown as (...args: any[]) => any
			}
		});
		expect(() => {
			parser.parseTemplate('<if test="func(param1)">');
		}).toThrow(TemplateParserException);
	});

	it('must handle comments properly', () => {
		expect(parser.parseTemplate('<!-- foo -->')).toBe('<!-- foo -->');
		parser.setOptions({
			preserveComments: false
		});
		expect(parser.parseTemplate('<!-- foo -->')).toBe('');
	});
});
