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
  audioBuffer?: string; // Base64 encoded MP3 audio data
  error?: string;
  timestamp: string;
}
