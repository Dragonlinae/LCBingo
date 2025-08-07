import express from 'express';
import { io } from '../server/server.js';
import { Player, QuestionFilter, Board } from '../types/bingotypes.js';
import { pageController } from '../controllers/pageController.js';
import { newRoom } from './game.js';

export const routes = express.Router();

routes.get('/', pageController.renderHomePage);

io.of('/').on('connection', (socket) => {
  socket.emit('system message', 'Connection established');
  console.log(
    `a user connected, id: ${socket.id}, recovered: ${socket.recovered}`,
  );
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('chat message', (msg, user) => {
    console.log(`message: ${user} - ${msg}`);
    io.emit('chat message', msg, user);
  });
  socket.on('join room', (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
    socket.emit('joined room', room);
  });
  socket.on(
    'create game',
    (
      p1Name,
      p2Name,
      boardSize,
      freeOnly,
      category,
      difficulties,
      winCondition,
      announce,
    ) => {
      createNewRoom(
        socket,
        p1Name,
        p2Name,
        boardSize,
        freeOnly,
        category,
        difficulties,
        winCondition,
        announce,
      );
    },
  );
});

async function createNewRoom(
  socket: any,
  p1Name: string,
  p2Name: string,
  boardSize: number,
  freeOnly: boolean,
  category: string,
  difficulties: string[],
  winCondition: number,
  announce: boolean,
) {
  try {
    let newRoomId = await newRoom(
      new Board(
        new Player(p1Name),
        new Player(p2Name),
        Number(boardSize),
        new QuestionFilter(category, difficulties, freeOnly),
        Number(winCondition),
      ),
    );
    socket.emit('nav', '/game?roomId=' + newRoomId);
    if (announce) {
      io.emit('game announce', p1Name, p2Name, newRoomId);
    }
  } catch (error) {
    console.error('Error creating new room:', error);
    socket.emit('system message', 'Failed to create a new game room. ' + error);
  }
}
