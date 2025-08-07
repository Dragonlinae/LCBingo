import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { app, server } from './server/server.js';
import { routes } from './routes/index.js';
import { gameRoutes } from './routes/game.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use('/static', express.static(path.join(__dirname, '../public')));
app.use('/', routes);
app.use('/game', gameRoutes);

server.listen(process.env.port, () => {
  console.log(`server running at http://localhost:${process.env.port}`);
});
