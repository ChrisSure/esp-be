import { Request, Response } from 'express';
import OpenAI from 'openai';
import { HelloWorldResponse, OpenAITestResponse } from './core/interfaces';

export class MainController {
  static getHelloWorld(req: Request, res: Response): void {
    const response: HelloWorldResponse = {
      message: 'Hello World! Express.js + TypeScript is running!',
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  }

  static async testOpenAI(req: Request, res: Response): Promise<void> {
    const timestamp = new Date().toISOString();
    
    try {
      // Check if API key is provided
      if (!process.env.OPENAI_API_KEY) {
        const response: OpenAITestResponse = {
          success: false,
          message: 'OpenAI API key not found in environment variables',
          error: 'Please set OPENAI_API_KEY in your .env file',
          timestamp,
        };
        res.status(400).json(response);
        return;
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Make a simple test call to OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello from OpenAI!" and confirm that the API integration is working.',
          },
        ],
        max_tokens: 50,
      });

      const response: OpenAITestResponse = {
        success: true,
        message: 'OpenAI API call successful!',
        openaiResponse: completion.choices[0]?.message?.content || 'No response content',
        timestamp,
      };

      res.json(response);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      const response: OpenAITestResponse = {
        success: false,
        message: 'Failed to call OpenAI API',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp,
      };

      res.status(500).json(response);
    }
  }
}
