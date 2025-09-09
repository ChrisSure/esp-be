import { Request, Response } from 'express';
import { MainController } from '../index';
import { HelloWorldResponse } from '../core/interfaces';

describe('MainController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockRequest = {};
    mockResponse = {
      json: mockJson,
    };
  });

  describe('getHelloWorld', () => {
    it('should return hello world message with timestamp', () => {
      // Act
      MainController.getHelloWorld(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockJson).toHaveBeenCalledTimes(1);
      
      const response: HelloWorldResponse = mockJson.mock.calls[0][0];
      expect(response.message).toBe('Hello World! Express.js + TypeScript is running!');
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(response.timestamp)).toBeInstanceOf(Date);
    });

    it('should return a valid ISO timestamp', () => {
      // Act
      MainController.getHelloWorld(mockRequest as Request, mockResponse as Response);

      // Assert
      const response: HelloWorldResponse = mockJson.mock.calls[0][0];
      const timestamp = new Date(response.timestamp);
      const now = new Date();
      
      // Timestamp should be within the last 1000ms (allowing for test execution time)
      expect(Math.abs(now.getTime() - timestamp.getTime())).toBeLessThan(1000);
    });
  });
});
