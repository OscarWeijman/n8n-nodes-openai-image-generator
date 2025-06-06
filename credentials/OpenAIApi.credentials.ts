import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class OpenAiApi implements ICredentialType {
	name = 'openAIApi';
	displayName = 'OpenAI API';
	documentationUrl = 'https://platform.openai.com/docs/api-reference/authentication';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your OpenAI API key',
		},
		{
			displayName: 'Organization ID',
			name: 'organizationId',
			type: 'string',
			default: '',
			required: false,
			description: 'Your OpenAI organization ID (optional)',
		},
	];
}
