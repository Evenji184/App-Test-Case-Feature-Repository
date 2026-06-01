"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callOpenAI = callOpenAI;
exports.callAnthropic = callAnthropic;
exports.testConnection = testConnection;
const axios_1 = __importDefault(require("axios"));
const authService_1 = require("./authService");
async function callOpenAI(params) {
    const response = await axios_1.default.post(params.requestUrl, {
        model: params.modelName,
        messages: params.messages,
    }, {
        headers: {
            Authorization: `Bearer ${params.apiKey}`,
            'Content-Type': 'application/json',
            'Accept-Encoding': 'identity',
        },
        timeout: 60000,
        decompress: false,
    });
    const data = response.data;
    const content = ((data.choices || [{}])[0]?.message?.content) || '';
    if (!content)
        throw new authService_1.AppError('AI_ERROR', 'AI 返回内容为空');
    return content;
}
async function callAnthropic(params) {
    let url = params.requestUrl;
    if (!url.endsWith('/v1/messages')) {
        url = url.replace(/\/$/, '') + '/v1/messages';
    }
    const response = await axios_1.default.post(url, {
        model: params.modelName,
        max_tokens: 8192,
        messages: params.messages,
    }, {
        headers: {
            'x-api-key': params.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
            'Accept-Encoding': 'identity',
        },
        timeout: 60000,
        decompress: false,
    });
    const data = response.data;
    const contentBlocks = data.content || [];
    const text = contentBlocks
        .filter(b => b.type === 'text')
        .map(b => b.text || '')
        .join('');
    if (!text)
        throw new authService_1.AppError('AI_ERROR', 'AI 返回内容为空');
    return text;
}
async function testConnection(params) {
    const testMessages = [{ role: 'user', content: 'Hello, please reply with "OK".' }];
    if (params.providerFormat === 'anthropic') {
        await callAnthropic({
            requestUrl: params.requestUrl,
            apiKey: params.apiKey,
            modelName: params.modelName,
            messages: testMessages,
        });
    }
    else {
        await callOpenAI({
            requestUrl: params.requestUrl,
            apiKey: params.apiKey,
            modelName: params.modelName,
            messages: testMessages,
        });
    }
}
//# sourceMappingURL=providerClient.js.map