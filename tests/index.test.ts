import request from 'supertest';
import app from '../src/index';

describe('Express App', () => {
  describe('GET /', () => {
    it('should return welcome message', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Hello World! Express.js + TypeScript is running!');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for nonexistent routes', async () => {
      const response = await request(app).get('/nonexistent');
      
      expect(response.status).toBe(404);
    });
  });
});
