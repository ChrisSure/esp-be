import { Request, Response } from 'express';
import { HelloWorldResponse } from './core/interfaces';

export class MainController {
  static getHelloWorld(req: Request, res: Response): void {
    const response: HelloWorldResponse = {
      message: 'Hello World! Express.js + TypeScript is running!',
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  }
}
