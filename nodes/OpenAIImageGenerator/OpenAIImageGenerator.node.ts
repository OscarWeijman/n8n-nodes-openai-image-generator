import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IBinaryKeyData,
	IRequestOptions,
} from 'n8n-workflow';

export class OpenAiImageGenerator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OpenAI Image Generator',
		name: 'openAiImageGenerator',
		icon: 'file:image.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: "Generate images using OpenAI's DALL-E models",
		defaults: {
			name: 'OpenAI Image Generator',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'openAIApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Generate Image',
						value: 'generateImage',
						description: 'Generate an image from a text prompt',
						action: 'Generate an image from a text prompt',
					},
					{
						name: 'Create Image Variation',
						value: 'createVariation',
						description: 'Create a variation of an existing image',
						action: 'Create a variation of an existing image',
					},
				],
				default: 'generateImage',
			},

			// Generate Image Parameters
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['generateImage'],
					},
				},
				description: 'A text description of the desired image(s)',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [
					{
						name: 'DALL-E 3',
						value: 'dall-e-3',
					},
					{
						name: 'DALL-E 2',
						value: 'dall-e-2',
					},
				],
				default: 'dall-e-3',
				displayOptions: {
					show: {
						operation: ['generateImage'],
					},
				},
				description: 'The model to use for image generation',
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'options',
				options: [
					{
						name: '1024x1024',
						value: '1024x1024',
					},
					{
						name: '1024x1792',
						value: '1024x1792',
					},
					{
						name: '1792x1024',
						value: '1792x1024',
					},
					{
						name: '256x256',
						value: '256x256',
					},
					{
						name: '512x512',
						value: '512x512',
					},
				],
				default: '1024x1024',
				displayOptions: {
					show: {
						operation: ['generateImage'],
					},
				},
				description: 'The size of the generated images',
			},
			{
				displayName: 'Quality',
				name: 'quality',
				type: 'options',
				options: [
					{
						name: 'Standard',
						value: 'standard',
					},
					{
						name: 'HD',
						value: 'hd',
					},
				],
				default: 'standard',
				displayOptions: {
					show: {
						operation: ['generateImage'],
						model: ['dall-e-3'],
					},
				},
				description: 'The quality of the image that will be generated',
			},
			{
				displayName: 'Style',
				name: 'style',
				type: 'options',
				options: [
					{
						name: 'Vivid',
						value: 'vivid',
					},
					{
						name: 'Natural',
						value: 'natural',
					},
				],
				default: 'vivid',
				displayOptions: {
					show: {
						operation: ['generateImage'],
						model: ['dall-e-3'],
					},
				},
				description: 'The style of the generated images',
			},
			{
				displayName: 'Number of Images',
				name: 'n',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 10,
				},
				default: 1,
				displayOptions: {
					show: {
						operation: ['generateImage'],
					},
				},
				description: 'The number of images to generate',
			},
			{
				displayName: 'Response Format',
				name: 'responseFormat',
				type: 'options',
				options: [
					{
						name: 'URL',
						value: 'url',
					},
					{
						name: 'Base64 JSON',
						value: 'b64_json',
					},
				],
				default: 'url',
				displayOptions: {
					show: {
						operation: ['generateImage'],
					},
				},
				description: 'The format in which the generated images are returned',
			},

			// Create Variation Parameters
			{
				displayName: 'Image Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['createVariation'],
					},
				},
				description: 'Name of the binary property containing the image to create variations of',
			},
			{
				displayName: 'Number of Variations',
				name: 'n',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 10,
				},
				default: 1,
				displayOptions: {
					show: {
						operation: ['createVariation'],
					},
				},
				description: 'The number of variations to generate',
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'options',
				options: [
					{
						name: '1024x1024',
						value: '1024x1024',
					},
					{
						name: '256x256',
						value: '256x256',
					},
					{
						name: '512x512',
						value: '512x512',
					},
				],
				default: '1024x1024',
				displayOptions: {
					show: {
						operation: ['createVariation'],
					},
				},
				description: 'The size of the generated images',
			},
			{
				displayName: 'Response Format',
				name: 'responseFormat',
				type: 'options',
				options: [
					{
						name: 'URL',
						value: 'url',
					},
					{
						name: 'Base64 JSON',
						value: 'b64_json',
					},
				],
				default: 'url',
				displayOptions: {
					show: {
						operation: ['createVariation'],
					},
				},
				description: 'The format in which the generated images are returned',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		let responseData;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const credentials = await this.getCredentials('openAIApi');

				if (operation === 'generateImage') {
					const prompt = this.getNodeParameter('prompt', i) as string;
					const model = this.getNodeParameter('model', i) as string;
					const size = this.getNodeParameter('size', i) as string;
					const n = this.getNodeParameter('n', i) as number;
					const responseFormat = this.getNodeParameter('responseFormat', i) as string;

					const body: {
						prompt: string;
						model: string;
						n: number;
						size: string;
						response_format: string;
						quality?: string;
						style?: string;
					} = {
						prompt,
						model,
						n,
						size,
						response_format: responseFormat,
					};

					if (model === 'dall-e-3') {
						body.quality = this.getNodeParameter('quality', i) as string;
						body.style = this.getNodeParameter('style', i) as string;
					}

					const options: IRequestOptions = {
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${credentials.apiKey}`,
						},
						method: 'POST',
						body,
						uri: 'https://api.openai.com/v1/images/generations',
						json: true,
					};

					if (credentials.organizationId) {
						if (!options.headers) options.headers = {};
						options.headers['OpenAI-Organization'] = credentials.organizationId as string;
					}

					responseData = await this.helpers.request(options);
				} else if (operation === 'createVariation') {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const n = this.getNodeParameter('n', i) as number;
					const size = this.getNodeParameter('size', i) as string;
					const responseFormat = this.getNodeParameter('responseFormat', i) as string;

					// Check if binary data exists
					if (!items[i].binary) {
						throw new NodeOperationError(this.getNode(), 'No binary data exists on item!');
					}

					const binaryData = items[i].binary as IBinaryKeyData;

					if (!binaryData[binaryPropertyName]) {
						throw new NodeOperationError(
							this.getNode(),
							`No binary data property "${binaryPropertyName}" exists on item!`,
						);
					}

					const dataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
					const binaryProperty = binaryData[binaryPropertyName];

					const formData = {
						image: {
							value: dataBuffer,
							options: {
								filename: binaryProperty.fileName || 'image.png',
								contentType: binaryProperty.mimeType,
							},
						},
						n,
						size,
						response_format: responseFormat,
					};

					const options: IRequestOptions = {
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
						},
						method: 'POST',
						uri: 'https://api.openai.com/v1/images/variations',
						formData,
						json: true,
					};

					if (credentials.organizationId) {
						if (!options.headers) options.headers = {};
						options.headers['OpenAI-Organization'] = credentials.organizationId as string;
					}

					responseData = await this.helpers.request(options);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);

				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
