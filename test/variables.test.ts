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

	it('must throw an exception for missing nested parameter references', () => {
		parser.setParameters({
			key: 'value',
			otherKey: 2,
			boolParam: false,
			params: {
				foo: 'bar'
			},
			moreParams: ['foo']
		});
		expect(() => {
			parser.parseTemplate('#{key} #{otherKey} #{boolParam} #{params.baz}');
		}).toThrow(MissingParameterException);
		expect(() => {
			parser.parseTemplate('#{key} #{otherKey} #{boolParam} #{moreParams.1}');
		}).toThrow(MissingParameterException);
	});

	it('must handle missing variables without throwing exceptions', () => {
		parser.setOptions({ throwOnMissingParams: false });
		expect(parser.parseTemplate('#{param1}')).toBe('');
	});

	it('must collect all missing params, adding them into a single exception', () => {
		parser.setOptions({ throwOnMissingParams: false, collectMissingParams: true });
		try {
			parser.parseTemplate('#{key1} #{key2}');
		} catch (e) {
			expect((e as any).message).toBe('Missing parameter references: key1,key2');
		}
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

	it('must parse parameter references using json mode', () => {
		parser.setOptions({ mode: 'json' });
		parser.setParameters({
			param1: 'foo',
			param2: ['foo', 'bar', 'baz'],
			param3: {
				inner: 'bar'
			},
			param4: 'with " quotes'
		});
		expect(parser.parseTemplate('{ {"prop": #{param1} }')).toBe('{ {"prop": "foo" }');
		expect(parser.parseTemplate('{ {"prop": #{param2} }')).toBe('{ {"prop": ["foo","bar","baz"] }');
		expect(parser.parseTemplate('{ {"prop": #{param2.0} }')).toBe('{ {"prop": "foo" }');
		expect(parser.parseTemplate('{ {"prop": #{param3.inner} }')).toBe('{ {"prop": "bar" }');
		expect(parser.parseTemplate('{ {"prop": #{param4} }')).toBe('{ {"prop": "with \\" quotes" }');
	});

	it('must parse raw parameter references using json mode', () => {
		parser.setOptions({ mode: 'json' });
		parser.setParameters({
			param1: 'foo',
			param2: {
				inner: 'bar'
			}
		});
		expect(parser.parseTemplate('{"prop": "${param1}"}')).toBe('{"prop": "foo"}');
		expect(parser.parseTemplate('{"prop": "${param2.inner}"}')).toBe('{"prop": "bar"}');
	});
});
