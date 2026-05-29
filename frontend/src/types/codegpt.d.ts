interface CodeGPTConfig {
  templateId?: string;
  pluginId?: string;
  showBtn?: boolean;
  btnOpacity?: string;
  model?: string;
  useMcpList?: string[];
  mcpEnv?: 'test' | 'prod';
  displayMode?: 'overlay' | 'sidebar';
}

interface ChatResultData {
  instruction: string;
  content: string;
  traceId: string;
  modelType: string;
  imageUrls: string[];
  fileInfos: unknown[];
}

interface ChatResult {
  type: 'chatResult';
  data: ChatResultData;
}

interface UseParams {
  templateId?: string;
  pluginId?: string;
  model?: string;
  instruction?: string;
  useCategories?: string[];
  useMcpList?: string[];
  mcpEnv?: 'test' | 'prod';
}

declare class CodeGPTInstance {
  onChatResult(callback: (result: ChatResult) => void): void;
  use(params: UseParams): void;
  changeParams(params: UseParams): void;
  show(): void;
  hide(): void;
  reload(): void;
  showButton(): void;
  hideButton(): void;
  destroy(): void;
}

interface CodeGPTConstructor {
  new (config: CodeGPTConfig): CodeGPTInstance;
}

declare var CodeGPT: CodeGPTConstructor;