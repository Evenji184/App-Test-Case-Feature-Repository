interface OpenAIMessage {
    role: string;
    content: string;
}
export declare function callOpenAI(params: {
    requestUrl: string;
    apiKey: string;
    modelName: string;
    messages: OpenAIMessage[];
}): Promise<string>;
export declare function callAnthropic(params: {
    requestUrl: string;
    apiKey: string;
    modelName: string;
    messages: OpenAIMessage[];
}): Promise<string>;
export declare function testConnection(params: {
    requestUrl: string;
    apiKey: string;
    modelName: string;
    providerFormat: string;
}): Promise<void>;
export {};
//# sourceMappingURL=providerClient.d.ts.map