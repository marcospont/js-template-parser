export interface TemplateParameters {
	[key: string]: any;
}

export type TemplateParserMode = 'sql' | 'default';

export type TemplateParserOptions = {
	mode?: TemplateParserMode;
	throwOnMissingParams?: boolean;
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
