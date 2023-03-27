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
} from '../src/exceptions';
import TemplateParser from '../src/parser/template-parser';

describe('Choice', () => {
	const parser = new TemplateParser();

	afterEach(() => {
		parser.clearParameters();
		parser.setOptions(TemplateParser.defaultOptions);
	});

	it('must throw an exception for unbalanced choose tags', () => {
		expect(() => {
			parser.parseTemplate('<choose>');
		}).toThrow(UnbalancedTagException);
	});

	it('must throw an exception for self-closing choose tags', () => {
		expect(() => {
			parser.parseTemplate('<choose />');
		}).toThrow(UnexpectedSelfClosingTagException);
	});

	it('must throw an exception for unexpected closing tag after a choose tag', () => {
		expect(() => {
			parser.parseTemplate('<choose></when>');
		}).toThrow(UnexpectedClosingTagException);
	});

	it('must throw an exception for choose tags with attributes', () => {
		expect(() => {
			parser.parseTemplate('<choose foo="bar">');
		}).toThrow(UnexpectedAttributeException);
	});

	it('must throw an exception for choose tags with no conditions', () => {
		expect(() => {
			parser.parseTemplate('<choose></choose>');
		}).toThrow(TemplateParserException);
	});

	it('must throw an exception for unexpected text inside a choose tag', () => {
		expect(() => {
			parser.parseTemplate('<choose>foo</choose>');
		}).toThrow(TemplateParserException);
	});

	it('must throw an exception for unexpected tags inside a choose tag', () => {
		parser.setParameters({
			param1: true
		});
		expect(() => {
			parser.parseTemplate('<choose><if test="param1"></if></choose>');
		}).toThrow(UnexpectedTagException);
		expect(() => {
			parser.parseTemplate('<choose><choose></choose></choose>');
		}).toThrow(UnexpectedTagException);
	});

	it('must throw an exception for missing when attributes', () => {
		expect(() => {
			parser.parseTemplate('<choose><when>');
		}).toThrow(MissingAttributeException);
	});

	it('must throw an exception for unknown when attributes', () => {
		expect(() => {
			parser.parseTemplate('<choose><when foo="bar">');
		}).toThrow(UnknownAttributeException);
	});

	it('must throw an exception for invalid when attributes', () => {
		expect(() => {
			parser.parseTemplate('<choose><when test="">');
		}).toThrow(AttributeValueException);
	});

	it('must throw an exception for unclosed when tags', () => {
		parser.setParameters({
			param1: 'foo'
		});
		expect(() => {
			parser.parseTemplate('<choose><when test="param1"');
		}).toThrow(UnclosedTagException);
	});

	it('must throw an exception for unbalanced when tags', () => {
		parser.setParameters({
			param1: 'foo'
		});
		expect(() => {
			parser.parseTemplate('<choose><when test="param1">');
		}).toThrow(UnbalancedTagException);
	});

	it('must throw an exception for self-closing when tags', () => {
		parser.setParameters({
			param1: true
		});
		expect(() => {
			parser.parseTemplate('<choose><when test="param1" />');
		}).toThrow(UnexpectedSelfClosingTagException);
	});

	it('must throw an exception for unbalanced choose tags with one or more when tags', () => {
		parser.setParameters({
			param1: 'foo'
		});
		expect(() => {
			parser.parseTemplate('<choose><when test="param1"></when>');
		}).toThrow(UnbalancedTagException);
	});

	it('should process a choose tag with a single when tag that evaluates to true', () => {
		parser.setParameters({
			param1: true,
			param2: 'foo'
		});
		expect(parser.parseTemplate('<choose><when test="param1">#{param2}</when></choose>')).toBe('foo');
	});

	it('should process a choose tag with a single when tag that evaluates to false', () => {
		parser.setParameters({
			param1: true,
			param2: 'foo'
		});
		expect(parser.parseTemplate('<choose><when test="!param1">#{param2}</when></choose>')).toBe('');
	});

	it('should process a choose tag with multiple when tags', () => {
		parser.setParameters({
			param1: true,
			param2: 'foo',
			param3: 'bar'
		});
		expect(
			parser.parseTemplate(`
				<choose>
					<when test="param1">#{param2}</when>
					<when test="param2 == 'bar'">#{param3}</when>
				</choose>
			`)
		).toBe('foo');
		expect(
			parser.parseTemplate(`
				<choose>
					<when test="!param1">#{param2}</when>
					<when test="param2 == 'foo'">#{param3}</when>
				</choose>
			`)
		).toBe('bar');
	});

	it('must throw an exception for otherwise tags without when tags or declared before when tags', () => {
		parser.setParameters({
			param1: 'foo'
		});
		expect(() => {
			parser.parseTemplate('<choose><otherwise></otherwise></choose>');
		}).toThrow(TemplateParserException);
	});

	it('must throw an exception for otherwise tags with attributes', () => {
		parser.setParameters({
			param1: 'foo'
		});
		expect(() => {
			parser.parseTemplate('<choose><when test="param1"></when><otherwise foo="bar"></otherwise></choose>');
		}).toThrow(TemplateParserException);
	});

	it('must throw an exception for unclosed otherwise tags', () => {
		parser.setParameters({
			param1: 'foo'
		});
		expect(() => {
			parser.parseTemplate('<choose><when test="param1"></when><otherwise');
		}).toThrow(UnclosedTagException);
	});

	it('must throw an exception for unbalanced otherwise tags', () => {
		parser.setParameters({
			param1: 'foo'
		});
		expect(() => {
			parser.parseTemplate('<choose><when test="param1"></when><otherwise>');
		}).toThrow(UnbalancedTagException);
	});

	it('must throw an exception for self-closing otherwise tags', () => {
		parser.setParameters({
			param1: true,
			param2: 'foo'
		});
		expect(() => {
			parser.parseTemplate('<choose><when test="param1">#{param2}</when><otherwise />');
		}).toThrow(UnexpectedSelfClosingTagException);
	});

	it('must throw an exception for an unbalanced if tag inside a when tag', () => {
		parser.setParameters({
			param1: 'foo'
		});
		expect(() => {
			parser.parseTemplate('<choose><when test="param1"><if test="param1"></when><otherwise>');
		}).toThrow(UnexpectedClosingTagException);
	});

	it('must throw an exception for when tags declared after an otherwise tag', () => {
		parser.setParameters({
			param1: 'foo'
		});
		expect(() => {
			parser.parseTemplate(`
				<choose>
					<when test="param1"></when>
					<otherwise>
					</otherwise>
					<when test="param1"></when>
				</choose>
			`);
		}).toThrow(TemplateParserException);
	});

	it('must throw an exception for duplicate otherwise tags', () => {
		parser.setParameters({
			param1: 'foo'
		});
		expect(() => {
			parser.parseTemplate(`
				<choose>
					<when test="param1"></when>
					<otherwise></otherwise>
					<otherwise></otherwise>
				</choose>
			`);
		}).toThrow(TemplateParserException);
	});

	it('must process a choose tag with when and otherwise tags', () => {
		parser.setParameters({
			param1: true,
			param2: 'foo',
			param3: 'bar'
		});
		expect(
			parser.parseTemplate(`
				<choose>
					<when test="param1">#{param2}</when>
					<otherwise>#{param3}</otherwise>
				</choose>
			`)
		).toBe('foo');
		expect(
			parser.parseTemplate(`
				<choose>
					<when test="!param1">#{param2}</when>
					<otherwise>#{param3}</otherwise>
				</choose>
			`)
		).toBe('bar');
	});

	it('must process a choose tag with when and otherwise tags combined with if tags', () => {
		parser.setParameters({
			param1: true,
			param2: 'foo',
			param3: 'bar'
		});
		expect(
			parser.parseTemplate(`
				<choose>
					<when test="param1">
						<if test="param2 == 'foo'">#{param3}</if>
					</when>
					<otherwise>#{param3}</otherwise>
				</choose>
			`)
		).toBe('bar');
		expect(
			parser.parseTemplate(`
				<choose>
					<when test="!param1">#{param2}</when>
					<otherwise>
						<if test="param3 == 'bar'">#{param2}</if>
					</otherwise>
				</choose>
			`)
		).toBe('foo');
		expect(
			parser.parseTemplate(`
				<if test="param1">
					<choose>
						<when test="param2 == 'foo'">#{param2}</when>
						<otherwise>#{param3}</otherwise>
					</choose>
				</if>
			`)
		).toBe('foo');
	});

	it('must process comments in when or otherwise tags', () => {
		parser.setParameters({
			param1: true
		});
		expect(
			parser.parseTemplate(`
				<choose>
					<when test="param1"><!-- foo --></when>
					<otherwise><!-- bar --></otherwise>
				</choose>
			`)
		).toBe('<!-- foo -->');
		expect(
			parser.parseTemplate(`
				<choose>
					<when test="!param1"><!-- foo --></when>
					<otherwise><!-- bar --></otherwise>
				</choose>
			`)
		).toBe('<!-- bar -->');
		expect(() => {
			parser.parseTemplate('<choose><!-- foo --></choose>');
		}).toThrow(TemplateParserException);
	});
});
