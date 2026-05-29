import axios from 'axios';
import { AppError } from './authService';

interface OpenAIMessage {
  role: string;
  content: string;
}

export async function callOpenAI(params: {
  requestUrl: string;
  apiKey: string;
  modelName: string;
  messages: OpenAIMessage[];
}): Promise<string> {
  const response = await axios.post(
    params.requestUrl,
    {
      model: params.modelName,
      messages: params.messages,
    },
    {
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        'Content-Type': 'application/json',
        'Accept-Encoding': 'identity',
      },
      timeout: 60000,
      decompress: false,
    }
  );

  const data = response.data;
  const content = ((data.choices || [{}])[0]?.message?.content) || '';
  if (!content) throw new AppError('AI_ERROR', 'AI 返回内容为空');
  return content;
}

export async function callAnthropic(params: {
  requestUrl: string;
  apiKey: string;
  modelName: string;
  messages: OpenAIMessage[];
}): Promise<string> {
  let url = params.requestUrl;
  if (!url.endsWith('/v1/messages')) {
    url = url.replace(/\/$/, '') + '/v1/messages';
  }

  const response = await axios.post(
    url,
    {
      model: params.modelName,
      max_tokens: 8192,
      messages: params.messages,
    },
    {
      headers: {
        'x-api-key': params.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'Accept-Encoding': 'identity',
      },
      timeout: 60000,
      decompress: false,
    }
  );

  const data = response.data;
  const contentBlocks: Array<{ type: string; text?: string }> = data.content || [];
  const text = contentBlocks
    .filter(b => b.type === 'text')
    .map(b => b.text || '')
    .join('');

  if (!text) throw new AppError('AI_ERROR', 'AI 返回内容为空');
  return text;
}

export async function testConnection(params: {
  requestUrl: string;
  apiKey: string;
  modelName: string;
  providerFormat: string;
}): Promise<void> {
  const testMessages = [{ role: 'user', content: 'Hello, please reply with "OK".' }];
  if (params.providerFormat === 'anthropic') {
    await callAnthropic({
      requestUrl: params.requestUrl,
      apiKey: params.apiKey,
      modelName: params.modelName,
      messages: testMessages,
    });
  } else {
    await callOpenAI({
      requestUrl: params.requestUrl,
      apiKey: params.apiKey,
      modelName: params.modelName,
      messages: testMessages,
    });
  }
}
