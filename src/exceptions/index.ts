export class TemplateParserException extends Error {
	constructor(message: string) {
		super(message);
	}
}

export class ExpressionParserException extends Error {
	constructor(public expression: string, cause: Error) {
		super(`Error parsing expression: ${expression} (${cause.message})`);
	}
}

export class InvalidParameterException extends TemplateParserException {
	constructor(public parameter: string) {
		super(`Invalid parameter reference: ${parameter}`);
	}
}

export class MissingParameterException extends TemplateParserException {
	constructor(public parameter: string) {
		super(`Missing parameter reference: ${parameter}`);
	}
}

export class UnbalancedTagException extends TemplateParserException {
	constructor(public tag: string) {
		super(`Unbalanced tag: <${tag}>`);
	}
}

export class UnclosedTagException extends TemplateParserException {
	constructor(public tag: string) {
		super(`Unclosed tag: <${tag}>`);
	}
}

export class UnknownTagException extends TemplateParserException {
	constructor(public tag: string) {
		super(`Unknown tag: <${tag}>`);
	}
}

export class UnexpectedTagException extends TemplateParserException {
	constructor(public tag: string, public parentTag: string, negative = false) {
		super(`Unexpected tag: <${tag}>. Must ${negative ? 'not ' : ''}be used inside a <${parentTag}> tag`);
	}
}

export class UnexpectedSelfClosingTagException extends TemplateParserException {
	constructor(public tag: string) {
		super(`Unexpected self-closing <${tag}> tag`);
	}
}

export class UnexpectedClosingTagException extends TemplateParserException {
	constructor(public closingTag: string, public expectedTag: string) {
		super(`Unexpected closing tag: </${closingTag}>. Expecting </${expectedTag}>`);
	}
}

export class MissingAttributeException extends TemplateParserException {
	constructor(public tag: string, public attribute: string) {
		super(`The ${attribute} attribute is mandatory for the ${tag} tag`);
	}
}

export class UnknownAttributeException extends TemplateParserException {
	constructor(public tag: string, public attribute: string) {
		super(`Unknown attribute ${attribute} on <${tag}> tag`);
	}
}

export class UnexpectedAttributeException extends TemplateParserException {
	constructor(public tag: string) {
		super(`Attributes are not expected on a <${tag}> tag`);
	}
}

export class AttributeValueException extends TemplateParserException {
	constructor(public tag: string, public attribute: string, mustBe?: string) {
		super(`Invalid value on attribute ${attribute} of tag <${tag}>${mustBe ? `. Expecting: ${mustBe}` : ''}`);
	}
}
