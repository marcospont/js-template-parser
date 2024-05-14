export interface TemplateParameters {
	[key: string]: any;
}

export type TemplateParserMode = 'sql' | 'json' | 'default';

export type TemplateParserOptions = {
	mode?: TemplateParserMode;
	throwOnMissingParams?: boolean;
	collectMissingParams?: boolean;
	trim?: boolean;
	preserveComments?: boolean;
	htmlEntities?: {
		[key: string]: string;
	};
	functions?: {
		[key: string]: (...args: any[]) => any;
	};
};

export type TagAttributes = {
	[key: string]: string;
};

export type LoopAttributes = {
	[key: string]: string | any[] | boolean;
};

export type ExpressionParserImpl = {
	parseAndEval: (input: string, params: TemplateParameters) => any;
	registerFunction: (name: string, impl: (...args: any[]) => any) => void;
};
