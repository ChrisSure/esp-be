import { Request, Response } from 'express';
import OpenAI from 'openai';
import {
  HelloWorldResponse,
  AudioProcessingResponse,
  Conversation,
  ConversationMessage,
  StartConversationRequest,
  StartConversationResponse,
} from './core/interfaces';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export class MainController {
  // In-memory conversation storage (in production, use a database)
  private static conversations: Map<string, Conversation> = new Map();

  private static readonly DEFAULT_BASE_CONTEXT =
    'Hi. I want to learn English could you be my teacher today. I want to talk with you on different themes, and you can improve my grammar and other things.';

  static getHelloWorld(req: Request, res: Response): void {
    const response: HelloWorldResponse = {
      message: 'Hello World! Express.js + TypeScript is running!',
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  }

  // Start a new conversation with optional base context
  static startConversation(req: Request, res: Response): void {
    try {
      const body = req.body || ({} as StartConversationRequest);
      const baseContext =
        body.baseContext || MainController.DEFAULT_BASE_CONTEXT;

      const conversationId = uuidv4();
      const now = new Date().toISOString();

      const systemMessage: ConversationMessage = {
        role: 'system',
        content: baseContext,
        timestamp: now,
      };

      const conversation: Conversation = {
        id: conversationId,
        messages: [systemMessage],
        createdAt: now,
        lastUpdatedAt: now,
      };

      MainController.conversations.set(conversationId, conversation);

      const response: StartConversationResponse = {
        success: true,
        conversationId,
        timestamp: now,
      };

      res.json(response);
    } catch (error) {
      console.error('Error starting conversation:', error);

      const response: StartConversationResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  // Debug endpoint to list all conversations
  static listConversations(req: Request, res: Response): void {
    try {
      const conversations = Array.from(
        MainController.conversations.entries()
      ).map(([id, conv]) => ({
        id,
        messagesCount: conv.messages.length,
        createdAt: conv.createdAt,
        lastUpdatedAt: conv.lastUpdatedAt,
      }));

      res.json({
        success: true,
        totalConversations: MainController.conversations.size,
        conversations,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Helper method to get conversation by ID
  private static getConversation(conversationId: string): Conversation | null {
    return MainController.conversations.get(conversationId) || null;
  }

  // Helper method to add message to conversation
  private static addMessageToConversation(
    conversationId: string,
    message: ConversationMessage
  ): boolean {
    const conversation = MainController.getConversation(conversationId);
    if (!conversation) {
      return false;
    }

    conversation.messages.push(message);
    conversation.lastUpdatedAt = new Date().toISOString();
    MainController.conversations.set(conversationId, conversation);
    return true;
  }

  static async processAudioRecord(req: Request, res: Response): Promise<void> {
    try {
      // Check if file was uploaded
      if (!req.file) {
        const errorResponse: AudioProcessingResponse = {
          success: false,
          error: 'No audio file provided',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Check if conversationId is provided (prioritize query params for file uploads)
      const conversationId =
        req.query.conversationId || req.body.conversationId;

      if (!conversationId) {
        const errorResponse: AudioProcessingResponse = {
          success: false,
          error:
            'Conversation ID is required. Please pass it as a query parameter: /record?conversationId=YOUR_ID',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Get conversation history
      const conversation = MainController.getConversation(
        conversationId as string
      );
      if (!conversation) {
        const errorResponse: AudioProcessingResponse = {
          success: false,
          error: 'Conversation not found. Please start a new conversation.',
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(errorResponse);
        return;
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Step 1: Convert audio to text using Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(req.file.path),
        model: 'whisper-1',
      });

      const transcribedText = transcription.text;

      // Step 2: Add user message to conversation
      const userMessage: ConversationMessage = {
        role: 'user',
        content: transcribedText,
        timestamp: new Date().toISOString(),
      };

      MainController.addMessageToConversation(
        conversationId as string,
        userMessage
      );

      // Step 3: Prepare messages for OpenAI (convert conversation history to OpenAI format)
      const messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }> = conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the new user message
      messages.push({
        role: 'user',
        content: transcribedText,
      });

      // Step 4: Send conversation history to OpenAI for AI response
      const chatCompletion = await openai.chat.completions.create({
        messages: messages,
        model: 'gpt-3.5-turbo',
      });

      const aiResponse =
        chatCompletion.choices[0]?.message?.content || 'No response generated';

      // Step 5: Add AI response to conversation
      if (aiResponse && aiResponse !== 'No response generated') {
        const assistantMessage: ConversationMessage = {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString(),
        };
        MainController.addMessageToConversation(
          conversationId as string,
          assistantMessage
        );
      }

      // Step 6: Convert AI response to speech using OpenAI TTS
      let audioBuffer: string | undefined;

      if (aiResponse && aiResponse !== 'No response generated') {
        try {
          const mp3 = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'nova', // Female voice
            input: aiResponse,
          });

          // Convert the response to a buffer and encode as base64
          const buffer = Buffer.from(await mp3.arrayBuffer());
          audioBuffer = buffer.toString('base64');
        } catch (ttsError) {
          console.error('Error generating TTS audio:', ttsError);
          // Continue without audio if TTS fails
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      // Return successful response
      const response: AudioProcessingResponse = {
        success: true,
        conversationId: conversationId as string,
        transcription: transcribedText,
        aiResponse: aiResponse,
        audioBuffer: audioBuffer,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error('Error processing audio:', error);

      const errorResponse: AudioProcessingResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(errorResponse);
    }
  }
}
