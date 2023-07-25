import {
	AttributeValueException,
	ExpressionParserException,
	MissingAttributeException,
	UnbalancedTagException,
	UnclosedTagException,
	UnexpectedClosingTagException,
	UnexpectedSelfClosingTagException,
	UnknownAttributeException
} from '../src/exceptions';
import TemplateParser from '../src/parser/template-parser';

describe('Condition', () => {
	const parser = new TemplateParser();

	afterEach(() => {
		parser.clearParameters();
		parser.setOptions(TemplateParser.defaultOptions);
	});

	it('must throw an exception for if tags with missing attributes', () => {
		expect(() => {
			parser.parseTemplate('<if></if>');
		}).toThrow(MissingAttributeException);
	});

	it('must throw an exception for if tags with unknown attributes', () => {
		expect(() => {
			parser.parseTemplate('<if foo="bar"></if>');
		}).toThrow(UnknownAttributeException);
	});

	it('must throw an exception for invalid test attribute on an if tag', () => {
		expect(() => {
			parser.parseTemplate('<if test=""></if>');
		}).toThrow(AttributeValueException);
	});

	it('must throw an exception for unbalanced if tags', () => {
		parser.setParameters({
			param1: 'foo'
		});
		expect(() => {
			parser.parseTemplate('<if test="param1 == 1">');
		}).toThrow(UnbalancedTagException);
	});

	it('must throw an exception for unclosed if tags', () => {
		parser.setParameters({
			param1: 'foo'
		});
		expect(() => {
			parser.parseTemplate('<if test="param1 == 1"');
		}).toThrow(UnclosedTagException);
	});

	it('must throw an exception for self-closing if tags', () => {
		parser.setParameters({
			param1: 'foo'
		});
		expect(() => {
			parser.parseTemplate('<if test="param1 == 1" />');
		}).toThrow(UnexpectedSelfClosingTagException);
	});

	it('must throw an exception for unexpected closing tags on an if tag', () => {
		parser.setParameters({
			param1: 'foo'
		});
		expect(() => {
			parser.parseTemplate('<if test="param1 == 1"></foo>');
		}).toThrow(UnexpectedClosingTagException);
	});

	it('must process if tags', () => {
		parser.setParameters({
			param1: true,
			param2: 'foo'
		});
		expect(parser.parseTemplate('<if test="param1">#{param2}</if>')).toBe('foo');
		expect(parser.parseTemplate('<if test="!param1">#{param2}</if>')).toBe('');
		expect(parser.parseTemplate('before <if test="param1">#{param2} </if>after')).toBe('before foo after');
		expect(parser.parseTemplate('before <if test="!param1">#{param2} </if>after')).toBe('before after');
	});

	it('must process variable references and if tags', () => {
		parser.setParameters({
			param1: true,
			param2: 'foo',
			param3: 'bar'
		});
		expect(parser.parseTemplate(`this is a test <if test="param1">#{param2}</if> <if test="param1">#{param3}</if>`)).toBe(
			'this is a test foo bar'
		);
	});

	it('must process variable references and if tags with multiple expressions', () => {
		parser.setParameters({
			param1: true,
			param2: 'foo',
			param3: 'bar'
		});
		expect(parser.parseTemplate(`this is a test <if test="param1 && param2 == 'foo'">#{param3}</if>`)).toBe('this is a test bar');
	});

	it('must throw an exception for invalid test expressions on an if tag', () => {
		parser.setParameters({
			param1: 'foo',
			param2: 'bar'
		});
		expect(() => {
			parser.parseTemplate('<if test="param1 ?? param2"></if>');
		}).toThrow(ExpressionParserException);
	});

	it('must process nested if tags', () => {
		parser.setParameters({
			param1: true,
			param2: 'foo',
			param3: 'bar'
		});
		expect(parser.parseTemplate(`<if test="param1"><if test="param2 == 'foo'">#{param3}</if></if>`)).toBe('bar');
	});

	it('must process comments in if tags', () => {
		parser.setParameters({
			param1: true,
			param2: 'foo'
		});
		expect(parser.parseTemplate(`<if test="param1"><!-- foo --></if>`)).toBe('<!-- foo -->');
		expect(parser.parseTemplate(`<if test="param2 == 'bar'"><!-- foo --></if>`)).toBe('');
	});
});
