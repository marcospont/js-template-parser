# js-template-parser

This library contains a simple and straightforward template parser that supports parameter interpolations, conditions, choices and loops by using HTML tags and attributes.

The tags used in this library (and most of the semantics behind their attributes) are inspired on the [MyBatis](https://mybatis.org/) framework.

The parser uses great solutions from the following NPM packages:

- [html-tokenizer](https://www.npmjs.com/package/html-tokenizer) - an iterator based HTML tokenizer
- [morph-expressions](https://www.npmjs.com/package/morph-expressions) - an expression parser and evaluator
- [sqlstring](https://www.npmjs.com/package/sqlstring) - a string escaper for ANSI SQL
- [mybatis-mapper](https://www.npmjs.com/package/mybatis-mapper) - a mybatis mapper implementation for Node.js

## Install

Using NPM or Yarn, type one of the following commands to install `js-template-parser`:

```
npm i js-template-parser --save
yarn add js-template-parser
```

## Usage and Documentation

### Parser Options

The following options can be used to configure the template parser:

- **mode** - 'sql' or 'default', default is 'default'. In SQL mode, string variables are escaped by the ANSI SQL standards
- **throwOnMissingParams** - boolean, default is true. Whether to throw exceptions for missing parameter references
- **collectMissingParams** - boolean, default is false. If true, an exception will be thrown with all missing parameter references
- **trim** - boolean, default false. Whether to trim trailing whitespace chars from the template contents
- **preserveComments** - boolean, default true. Whether to preserve or remove comments from the template
- **htmlEntities** - accepts a map of HTML entities with their unicode translations

```
import { TemplateParser } from 'js-template-parser';

const parser = new TemplateParser();

parser.setOptions({
    mode: 'sql',
    trim: true,
    preserveComments: false
});
```

### Parameters Interpolation

The parser expects a set of parameters to be passed as a key-value map. The map keys can be of any type. Inside the template contents, parameters can be referenced and interpolated in two ways: escape mode and raw mode. Escape mode interpolations must start with the '#' character and raw mode interpolations must start with the '$' character. Curly braces are used as the delimiters of the interpolation.

When the mode option is set to default, the outcome of the interpolations is the same in both modes. However, when mode is set to sql, escape mode will escape all string values whereas the raw mode will apply the original parameter values.

If a parameter is an array or an object, the parser interpolation supports accessing members of array or object parameters in any level, using the dot or square brackets notations.

Below, some basic and advanced usages of parameters interpolation:

```
import { TemplateParser } from 'js-template-parser';

const parser = new TemplateParser();

parser.setParameters({
	stringParam: 'some string',
	numParam: 100,
	listParam: ['foo', 'bar'],
	objParam: {
		foo: 1,
		bar: 2
	}
});

parser.parseTemplate(`#{stringParam}`); // outputs some string
parser.parseTemplate(`#{numParam}`); // outputs 100
parser.parseTemplate(`#{listParam}`); // outputs foo,bar
parser.parseTemplate(`#{listParam[0]}`); // outputs foo
parser.parseTemplate(`#{objParam.foo}`); // outputs 1
```

The parser checks if the parameter names referenced at root level of the interpolation are registered, throwing exceptions for invalid references unless the 'throwOnMissingParams' option is disabled.

When accessing array or object members that are invalid in any level, the parser will convert it into an empty string.

When referencing an array or an object parameter directly in default mode, the parser will convert it into a string by calling the toString() method on it.

#### SQL Mode

When the parser mode is set to 'sql', all parameters string interpolations (in any depth) will be escaped.

If an array parameter is directly interpolated in sql mode, the parser will convert it into a string using comma as the elements separator.

If an object parameter is directly interpolated in sql mode, the parser will convert it into a key = value sequence using comma as the separator.

```
import { TemplateParser } from 'js-template-parser';

const parser = new TemplateParser();

parser.setOptions({
    mode: 'sql'
});
parser.setParameters({
    stringParam: 'baz',
    listParam: ['foo', 'bar']
});
parser.parseTemplate(`#{stringParam}`); // prints 'baz'
parser.parseTemplate(`${stringParam}`); // raw interpolation, prints baz
parser.parseTemplate(`#{listParam[0]}`); // prints 'foo'
parser.parseTemplate(`#{listParam}`); // prints 'foo', 'bar'
```

### Conditions

Conditions are supported by the parser through an <if> HTML tag. The condition expression is expected to be provided through the 'test' attribute of the tag.

The expressions used in conditions may reference the parameters passed to the parser (in any depth, like in the interpolation support mentioned above). Also the expressions can contain boolean constants, strings, numbers and operators. For detailed explanations on the syntax supported within the condition expressions, please check the [morph-expressions](https://www.npmjs.com/package/morph-expressions) documentation.

Condition tags can be nested, the 'test' attribute is mandatory and cannot be empty.

Examples:

```
import { TemplateParser } from 'js-template-parser';

const parser = new TemplateParser();

parser.setParameters({
	check: true,
	thenValue: 'foo'
});

parser.parseTemplate(`<if test="check">#{thenValue}</if>`); // prints foo
parser.parseTemplate(`<if test="!check">#{thenValue}</if>`); // prints an empty string
```

### Choices

Choices are supported by the parser through <choose>, <when> and <otherwise> tags. The conditions to be evaluated are expected to be provided through the 'test' attribute of <when> tags.

Like the 'test' attribute of the <if> tag, the 'test' attirbute of the <when> tags also supports parameter references in any depth, boolean constants, strings, numbers and operators.

Choice tags can be nested. The 'test' attribute is mandatory in <when> tags and cannot be empty.

A <choose> tag must have at least one <when> tag and cannot contain text or comments between the <choose> tag and the <when> and <otherwise> tags. The <otherwise> tag can be declared only once under a <choose> tag and must be the last child (after all <when> tags). The first <when> tag containing a test expression that evaluates to true will be processed, whereas all other subsequent <when> tags and the <otherwise> tag will be discarded (even if the evaluate to true).

Examples:

```
import { TemplateParser } from 'js-template-parser';

const parser = new TemplateParser();

parser.setParameters({
	check: true,
	positive: 'foo',
	negative: 'bar'
});
parser.parseTemplate(`
	<choose>
		<when test="check">#{positive}</when>
		<otherwise>#{negative}</otherwise>
	</choose>
`); // prints foo
parser.parseTemplate(`
	<choose>
		<when test="!check">#{positive}</when>
		<otherwise>#{negative}</otherwise>
	</choose>
`); // prints bar
```

### Loops

Loops are implemented by the parser through <foreach> tags. These tags expected a mandatory 'collection' attribute that must contain an iterable parameter (strings, arrays or other objects supporting an iterator).

The 'collection' attribute only accepts direct parameter references (no nested property access support).

Within the <foreach> tag, the current loop item can be accessed by the #{item} parameter reference, although this name can be changed through the 'item' attribute of the <foreach> tag. Likewise, the current loop index can be accessed by the #{index} parameter reference, which can also be customized by the 'index' attribute of the <foreach> tag.

Loops also support prefixes and suffixes through the 'open' and 'close' attributes. The loop iterations output can also be joined using a custom separator defined in the 'separator' attribute.

Last but not least, the output produced by each loop iteration can be trimmed if the 'trim' attribute is set to 'true'.

Examples:

```
import { TemplateParser } from 'js-template-parser';

const parser = new TemplateParser();

parser.setParameters({
	loop: ['foo', 'bar', 'baz']
});
parser.parseTemplate(`<foreach collection="loop">#{item}</foreach>`); // prints foobarbaz
parser.parseTemplate(`<foreach collection="loop" separator=",">#{item}</foreach>`); // prints foo,bar,baz
parser.parseTemplate(`<foreach collection="loop" separator="," open="(" close=")">#{item}</foreach>`); // prints (foo,bar,baz)
parser.parseTemplate(`<foreach collection="loop" item="x" index="i" separator=",">#{i}-#{x}</foreach>`); // prints 0-foo,1-bar,2-baz
```

### Reset default parser state

The parser offers two methods that allow to reset it to the default initial state:

```
import { TemplateParser } from 'js-template-parser';

const parser = new TemplateParser();

parser.clearParameters(); // clears the parameters
parser.setOptions(TemplateParser.defaultOptions); // reset parser to the default options
```

## Requirements

Node >= 18

## Contributing

Ideas for improvements or new features are very welcome. Feel free to submit pull requests :)

## License

[MIT](./LICENSE)
