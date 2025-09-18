import { Request, Response } from 'express';
import OpenAI from 'openai';
import { HelloWorldResponse, AudioProcessingResponse } from './core/interfaces';
import fs from 'fs';

export class MainController {
  static getHelloWorld(req: Request, res: Response): void {
    const response: HelloWorldResponse = {
      message: 'Hello World! Express.js + TypeScript is running!',
      timestamp: new Date().toISOString(),
    };

    res.json(response);
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

      // Step 2: Send transcribed text to OpenAI for AI response
      const chatCompletion = await openai.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: transcribedText,
          },
        ],
        model: 'gpt-3.5-turbo',
      });

      const aiResponse =
        chatCompletion.choices[0]?.message?.content || 'No response generated';

      // Step 3: Convert AI response to speech using OpenAI TTS
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
