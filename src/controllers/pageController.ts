import type { Request, Response } from 'express';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import path from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const pageController = {
  renderHomePage: (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
  },
  renderGamePage: (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../views/game.html'));
  }
};