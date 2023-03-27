import { InvalidParameterException, MissingParameterException } from '../src/exceptions';
import TemplateParser from '../src/parser/template-parser';

describe('Variables', () => {
	const parser = new TemplateParser();

	afterEach(() => {
		parser.clearParameters();
		parser.setOptions(TemplateParser.defaultOptions);
	});

	it('must parse parameter references', () => {
		parser.setParameters({
			param1: 'foo',
			param2: 'bar',
			param3: 'baz'
		});
		expect(parser.parseTemplate('#{param1}')).toBe('foo');
		expect(parser.parseTemplate('#{param1} #{param2}')).toBe('foo bar');
		expect(parser.parseTemplate('#{param3} #{param1}')).toBe('baz foo');
		expect(parser.parseTemplate('the #{param1} comes before #{param3}')).toBe('the foo comes before baz');
		expect(parser.parseTemplate('#{param1}-#{param1}')).toBe('foo-foo');
	});

	it('must parse raw parameter references', () => {
		parser.setParameters({
			param1: 'foo',
			param2: 'bar',
			param3: 'baz',
			param4: null
		});
		expect(parser.parseTemplate('${param1}')).toBe('foo');
		expect(parser.parseTemplate('${param1} ${param2}')).toBe('foo bar');
		expect(parser.parseTemplate('${param3} ${param1}')).toBe('baz foo');
		expect(parser.parseTemplate('${param4}')).toBe('');
	});

	it('must parse nested parameter references', () => {
		parser.setParameters({
			param1: {
				foo: 'bar',
				baz: 'qux'
			}
		});
		expect(parser.parseTemplate('${param1.foo}')).toBe('bar');
		expect(parser.parseTemplate('${param1.baz}')).toBe('qux');
	});

	it('must parse parameter references using numeric array indexes', () => {
		parser.setParameters({
			param1: ['foo', 'bar']
		});
		expect(parser.parseTemplate('${param1[0]}')).toBe('foo');
		expect(parser.parseTemplate('${param1[1]}')).toBe('bar');
	});

	it('must throw an exception for invalid parameter references', () => {
		expect(() => {
			parser.parseTemplate('#{}');
		}).toThrow(InvalidParameterException);
		expect(() => {
			parser.parseTemplate('#{ invalid }');
		}).toThrow(InvalidParameterException);
		expect(() => {
			parser.parseTemplate('#{%&*}');
		}).toThrow(InvalidParameterException);
	});

	it('must throw an exception for missing parameter references', () => {
		expect(() => {
			parser.parseTemplate('#{param1}');
		}).toThrow(MissingParameterException);
	});

	it('must handle missing variables without throwing exceptions', () => {
		parser.setOptions({ throwOnMissingParams: false });
		expect(parser.parseTemplate('#{param1}')).toBe('');
	});

	it('must parse parameter references using sql mode', () => {
		parser.setOptions({ mode: 'sql' });
		parser.setParameters({
			param1: 'foo',
			param2: `joe's`,
			param3: ['foo', 'bar']
		});
		expect(parser.parseTemplate('#{param1}')).toBe(`'foo'`);
		expect(parser.parseTemplate('#{param2}')).toBe(`'joe\\'s'`);
		expect(parser.parseTemplate('#{param3}')).toBe(`'foo', 'bar'`);
	});

	it('must parse raw parameter references using sql mode', () => {
		parser.setOptions({ mode: 'sql' });
		parser.setParameters({
			param1: 'foo',
			param2: `joe's`,
			param3: ['foo', 'bar']
		});
		expect(parser.parseTemplate('${param1}')).toBe(`foo`);
		expect(parser.parseTemplate('${param2}')).toBe(`joe's`);
		expect(parser.parseTemplate('${param3}')).toBe(`foo,bar`);
	});
});
