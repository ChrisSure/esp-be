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
  conversationId?: string;
  transcription?: string;
  aiResponse?: string;
  audioBuffer?: string; // Base64 encoded MP3 audio data
  error?: string;
  timestamp: string;
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  messages: ConversationMessage[];
  createdAt: string;
  lastUpdatedAt: string;
}

export interface StartConversationRequest {
  baseContext?: string;
}

export interface StartConversationResponse {
  success: boolean;
  conversationId?: string;
  error?: string;
  timestamp: string;
}
