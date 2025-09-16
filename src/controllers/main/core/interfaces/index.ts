export interface HelloWorldResponse {
  message: string;
  timestamp: string;
}

export interface OpenAITestResponse {
  success: boolean;
  message: string;
  openaiResponse?: string;
  error?: string;
  timestamp: string;
}

export interface AudioProcessingResponse {
  success: boolean;
  transcription?: string;
  aiResponse?: string;
  error?: string;
  timestamp: string;
}
