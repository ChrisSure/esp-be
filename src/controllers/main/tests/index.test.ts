import { Request, Response } from 'express';
import { MainController } from '../index';
import {
  HelloWorldResponse,
  StartConversationResponse,
  AudioProcessingResponse,
} from '../core/interfaces';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: jest.fn().mockResolvedValue({
          text: 'Hello, this is a test transcription.',
        }),
      },
      speech: {
        create: jest.fn().mockResolvedValue({
          arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('fake audio')),
        }),
      },
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'This is a test AI response.',
              },
            },
          ],
        }),
      },
    },
  }));
});

// Mock fs
jest.mock('fs', () => ({
  createReadStream: jest.fn(() => ({}) as any),
  unlinkSync: jest.fn(),
  existsSync: jest.fn(() => true),
}));

describe('MainController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Clear conversation storage before each test
    (MainController as any).conversations.clear();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockRequest = {
      headers: {
        'content-type': 'application/json',
      },
      query: {},
      body: {},
    };
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getHelloWorld', () => {
    it('should return hello world message with timestamp', () => {
      // Act
      MainController.getHelloWorld(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockJson).toHaveBeenCalledTimes(1);

      const response: HelloWorldResponse = mockJson.mock.calls[0][0];
      expect(response.message).toBe(
        'Hello World! Express.js + TypeScript is running!'
      );
      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
      expect(new Date(response.timestamp)).toBeInstanceOf(Date);
    });

    it('should return a valid ISO timestamp', () => {
      // Act
      MainController.getHelloWorld(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      const response: HelloWorldResponse = mockJson.mock.calls[0][0];
      const timestamp = new Date(response.timestamp);
      const now = new Date();

      // Timestamp should be within the last 1000ms (allowing for test execution time)
      expect(Math.abs(now.getTime() - timestamp.getTime())).toBeLessThan(1000);
    });
  });

  describe('startConversation', () => {
    it('should create a new conversation with default base context', () => {
      // Arrange
      mockRequest.body = {};

      // Act
      MainController.startConversation(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockJson).toHaveBeenCalledTimes(1);
      const response: StartConversationResponse = mockJson.mock.calls[0][0];

      expect(response.success).toBe(true);
      expect(response.conversationId).toBe('test-uuid-123');
      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should create a new conversation with custom base context', () => {
      // Arrange
      const customContext = 'Custom learning context';
      mockRequest.body = { baseContext: customContext };

      // Act
      MainController.startConversation(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockJson).toHaveBeenCalledTimes(1);
      const response: StartConversationResponse = mockJson.mock.calls[0][0];

      expect(response.success).toBe(true);
      expect(response.conversationId).toBe('test-uuid-123');
    });

    it('should handle empty request body', () => {
      // Arrange
      mockRequest.body = undefined;

      // Act
      MainController.startConversation(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockJson).toHaveBeenCalledTimes(1);
      const response: StartConversationResponse = mockJson.mock.calls[0][0];

      expect(response.success).toBe(true);
      expect(response.conversationId).toBe('test-uuid-123');
    });
  });

  describe('listConversations', () => {
    it('should return empty list when no conversations exist', () => {
      // Act
      MainController.listConversations(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockJson).toHaveBeenCalledTimes(1);
      const response = mockJson.mock.calls[0][0];

      expect(response.success).toBe(true);
      expect(response.totalConversations).toBe(0);
      expect(response.conversations).toEqual([]);
    });

    it('should return conversation list after creating conversations', () => {
      // Arrange - Create a conversation first
      mockRequest.body = {};
      MainController.startConversation(
        mockRequest as Request,
        mockResponse as Response
      );

      // Reset mocks for listConversations call
      jest.clearAllMocks();

      // Act
      MainController.listConversations(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockJson).toHaveBeenCalledTimes(1);
      const response = mockJson.mock.calls[0][0];

      expect(response.success).toBe(true);
      expect(response.totalConversations).toBe(1);
      expect(response.conversations).toHaveLength(1);
      expect(response.conversations[0].id).toBe('test-uuid-123');
      expect(response.conversations[0].messagesCount).toBe(1);
    });
  });

  describe('processAudioRecord', () => {
    beforeEach(() => {
      // Mock file upload
      mockRequest.file = {
        path: '/fake/path/audio.mp3',
        originalname: 'test.mp3',
      } as any;
    });

    it('should return error when no file is provided', async () => {
      // Arrange
      mockRequest.file = undefined;

      // Act
      await MainController.processAudioRecord(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledTimes(1);
      const response: AudioProcessingResponse = mockJson.mock.calls[0][0];

      expect(response.success).toBe(false);
      expect(response.error).toBe('No audio file provided');
    });

    it('should return error when no conversationId is provided', async () => {
      // Arrange
      mockRequest.query = {};
      mockRequest.body = {};

      // Act
      await MainController.processAudioRecord(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledTimes(1);
      const response: AudioProcessingResponse = mockJson.mock.calls[0][0];

      expect(response.success).toBe(false);
      expect(response.error).toBe(
        'Conversation ID is required. Please pass it as a query parameter: /record?conversationId=YOUR_ID'
      );
    });

    it('should return error when conversation is not found', async () => {
      // Arrange
      mockRequest.query = { conversationId: 'non-existent-id' };
      mockRequest.body = {};

      // Act
      await MainController.processAudioRecord(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledTimes(1);
      const response: AudioProcessingResponse = mockJson.mock.calls[0][0];

      expect(response.success).toBe(false);
      expect(response.error).toBe(
        'Conversation not found. Please start a new conversation.'
      );
    });

    it('should process audio successfully with valid conversation', async () => {
      // Arrange - First create a conversation using the same mock objects
      mockRequest.body = {};
      MainController.startConversation(
        mockRequest as Request,
        mockResponse as Response
      );

      // Clear mocks for the audio processing call
      mockJson.mockClear();
      mockStatus.mockClear();

      // Setup audio processing request
      mockRequest.query = { conversationId: 'test-uuid-123' };
      mockRequest.body = {};

      // Act
      await MainController.processAudioRecord(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockJson).toHaveBeenCalledTimes(1);
      const response: AudioProcessingResponse = mockJson.mock.calls[0][0];

      expect(response.success).toBe(true);
      expect(response.conversationId).toBe('test-uuid-123');
      expect(response.transcription).toBe(
        'Hello, this is a test transcription.'
      );
      expect(response.aiResponse).toBe('This is a test AI response.');
      expect(response.audioBuffer).toBeDefined();
    });

    it('should prioritize query param over body for conversationId', async () => {
      // Arrange - Create a conversation using the same mock objects
      mockRequest.body = {};
      MainController.startConversation(
        mockRequest as Request,
        mockResponse as Response
      );

      // Clear mocks for the audio processing call
      mockJson.mockClear();
      mockStatus.mockClear();

      // Setup conflicting conversationIds
      mockRequest.query = { conversationId: 'test-uuid-123' };
      mockRequest.body = { conversationId: 'different-id' };

      // Act
      await MainController.processAudioRecord(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockJson).toHaveBeenCalledTimes(1);
      const response: AudioProcessingResponse = mockJson.mock.calls[0][0];

      expect(response.success).toBe(true);
      expect(response.conversationId).toBe('test-uuid-123');
    });
  });
});
