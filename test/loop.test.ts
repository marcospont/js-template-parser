import {
	AttributeValueException,
	InvalidParameterException,
	MissingAttributeException,
	UnbalancedTagException,
	UnclosedTagException,
	UnexpectedClosingTagException,
	UnexpectedSelfClosingTagException,
	UnknownAttributeException
} from '../src/exceptions';
import TemplateParser from '../src/parser/template-parser';

describe('Loop', () => {
	const parser = new TemplateParser();

	afterEach(() => {
		parser.clearParameters();
		parser.setOptions(TemplateParser.defaultOptions);
	});

	it('must throw an exception for foreach tags with missing attributes', () => {
		expect(() => {
			parser.parseTemplate('<foreach></foreach>');
		}).toThrow(MissingAttributeException);
	});

	it('must throw an exception for foreach tags with unknown attributes', () => {
		expect(() => {
			parser.parseTemplate('<foreach foo="bar"></foreach>');
		}).toThrow(UnknownAttributeException);
	});

	it('must throw an exception for empty collection attribute on an foreach tag', () => {
		expect(() => {
			parser.parseTemplate('<foreach collection=""></foreach>');
		}).toThrow(AttributeValueException);
	});

	it('must throw an exception for collection attribute not present in the parameters', () => {
		expect(() => {
			parser.parseTemplate('<foreach collection="param1"></foreach>');
		}).toThrow(InvalidParameterException);
	});

	it('must throw an exception for collection attribute that is not an iterable', () => {
		parser.setParameters({
			param1: true
		});
		expect(() => {
			parser.parseTemplate('<foreach collection="param1"></foreach>');
		}).toThrow(AttributeValueException);
	});

	it('must throw an exception for invalid item attribute', () => {
		parser.setParameters({
			param1: ['foo']
		});
		expect(() => {
			parser.parseTemplate('<foreach collection="param1" item=" invalid "></foreach>');
		}).toThrow(AttributeValueException);
	});

	it('must throw an exception for invalid trim attribute', () => {
		parser.setParameters({
			param1: ['foo']
		});
		expect(() => {
			parser.parseTemplate('<foreach collection="param1" trim="yes"></foreach>');
		}).toThrow(AttributeValueException);
	});

	it('must throw an exception for unbalanced foreach tags', () => {
		parser.setParameters({
			param1: ['foo']
		});
		expect(() => {
			parser.parseTemplate('<foreach collection="param1">#{item}');
		}).toThrow(UnbalancedTagException);
	});

	it('must throw an exception for unclosed foreach tags', () => {
		parser.setParameters({
			param1: ['foo']
		});
		expect(() => {
			parser.parseTemplate('<foreach collection="param1"');
		}).toThrow(UnclosedTagException);
	});

	it('must throw an exception for self-closing foreach tags', () => {
		parser.setParameters({
			param1: ['foo']
		});
		expect(() => {
			parser.parseTemplate('<foreach collection="param1" />');
		}).toThrow(UnexpectedSelfClosingTagException);
	});

	it('must throw an exception for unexpected closing tags on an foreach tag', () => {
		parser.setParameters({
			param1: ['foo']
		});
		expect(() => {
			parser.parseTemplate('<foreach collection="param1"></foo>');
		}).toThrow(UnexpectedClosingTagException);
	});

	it('must process foreach tags', () => {
		parser.setParameters({
			param1: ['foo', 'bar']
		});
		expect(
			parser.parseTemplate(`
				<foreach collection="param1">
					#{item}
				</foreach>
			`)
		).toMatch(/foo\s+bar/);
	});

	it('must process foreach tags with a string as collection', () => {
		parser.setParameters({
			param1: 'foo'
		});
		expect(
			parser.parseTemplate(`
				<foreach collection="param1">
					#{item}
				</foreach>
			`)
		).toMatch(/f\s+o\s+o/);
	});

	it('must process foreach tags with a custom item name', () => {
		parser.setParameters({
			param1: ['foo', 'bar']
		});
		expect(
			parser.parseTemplate(`
				<foreach collection="param1" item="val">
					#{val}
				</foreach>
			`)
		).toMatch(/foo\s+bar/);
	});

	it('must process foreach tags with a custom index name', () => {
		parser.setParameters({
			param1: ['foo', 'bar']
		});
		expect(
			parser.parseTemplate(`
				<foreach collection="param1" item="val" index="i">
					#{i}: #{val}
				</foreach>
			`)
		).toMatch(/0: foo\s+1: bar/);
	});

	it('must process foreach tags with a separator', () => {
		parser.setParameters({
			param1: ['foo', 'bar']
		});
		expect(
			parser.parseTemplate(`
				<foreach collection="param1" separator="and">
					#{item}
				</foreach>
			`)
		).toMatch(/foo\s+and\s*bar/);
	});

	it('must process foreach tags with open and close attributes', () => {
		parser.setParameters({
			param1: ['foo', 'bar']
		});
		expect(
			parser.parseTemplate(`
				<foreach collection="param1" open="(" close=")">
					#{item}
				</foreach>
			`)
		).toMatch(/(\s*foo\s+bar\s*)/);
	});

	it('must process foreach tags with open, close and separator in sql mode', () => {
		parser.setParameters({
			param1: ['foo', 'bar']
		});
		parser.setOptions({
			mode: 'sql'
		});
		expect(
			parser.parseTemplate(`
				<foreach collection="param1" open="(" close=")" separator="or">
					field = #{item}
				</foreach>
			`)
		).toMatch(/(\s*field = 'foo'\s+or\s*field = 'bar'\s*)/);
	});

	it('must trim the contents of a foreach tag', () => {
		parser.setParameters({
			param1: ['foo', 'bar']
		});
		expect(
			parser.parseTemplate(`
				<foreach collection="param1" trim="true" separator=",">
					#{item}
				</foreach>
			`)
		).toBe('foo,bar');
	});

	it('must process foreach tags with comments', () => {
		parser.setParameters({
			param1: ['foo', 'bar']
		});
		expect(
			parser.parseTemplate(`
				<foreach collection="param1">
					<!-- foo -->
				</foreach>
			`)
		).toMatch(/<!-- foo -->\s+<!-- foo -->/);
	});

	it('must process foreach tags with inner if tags', () => {
		parser.setParameters({
			param1: ['foo', 'bar']
		});
		expect(
			parser.parseTemplate(`
				<foreach collection="param1">
					<if test="item == 'foo'">#{item}</if>
				</foreach>
			`)
		).toMatch(/foo/);
	});

	it('must process foreach tags with inner choose tags', () => {
		parser.setParameters({
			param1: ['foo', 'bar']
		});
		expect(
			parser.parseTemplate(`
				<foreach collection="param1">
					<choose>
						<when test="item == 'foo'">yes</when>
						<otherwise>no</otherwise>
					</choose>
				</foreach>
			`)
		).toMatch(/yes\s*no/);
	});

	it('must process foreach tags followed by a comment', () => {
		parser.setParameters({
			param1: ['foo']
		});
		expect(
			parser.parseTemplate(`
				<foreach collection="param1">
					#{item}
				</foreach>
				<!-- end loop -->
			`)
		).toMatch(/foo\s+<!-- end loop -->/);
	});

	it('must process foreach tags followed by a parameter reference', () => {
		parser.setParameters({
			param1: ['foo']
		});
		expect(
			parser.parseTemplate(`
				<foreach collection="param1">
					#{item}
				</foreach>
				#{param1[0]}
			`)
		).toMatch(/foo\s+foo/);
	});

	it('must process sequential foreach tags', () => {
		parser.setParameters({
			param1: ['foo', 'bar']
		});
		expect(
			parser.parseTemplate(`
				<foreach collection="param1" trim="true" separator=",">
					#{item}
				</foreach>
				<foreach collection="param1" trim="true" separator=",">
					#{item}
				</foreach>
			`)
		).toMatch(/foo,bar\s*foo,bar/);
	});

	it('must process nested foreach tags', () => {
		parser.setParameters({
			param1: [
				['foo', 'bar'],
				['baz', 'qux']
			]
		});
		expect(
			parser.parseTemplate(`
				<foreach collection="param1" trim="true" separator=",">
					<foreach collection="item" trim="true" separator=",">
						#{item}
					</foreach>
				</foreach>
			`)
		).toMatch(/foo,bar,baz,qux/);
	});
});
