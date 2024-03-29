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
};

export type TagAttributes = {
	[key: string]: string;
};

export type LoopAttributes = {
	[key: string]: string | any[] | boolean;
};
