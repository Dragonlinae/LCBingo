import { Router } from 'express';
import { io } from '../server/server.js';
import { Board } from '../types/bingotypes.js';
import { pageController } from '../controllers/pageController.js';
import { nanoid } from 'nanoid'

export const gameRoutes = Router();

let rooms: Map<string, Board> = new Map<string, Board>();
let completedRooms: Map<string, Board> = new Map<string, Board>();

gameRoutes.get('/', pageController.renderGamePage);

// rooms.set("1", new Board(new Player("Dragonlinae"), new Player("Kyuukyuusha"), 2, new QuestionFilter("algorithms", ["EASY"]))); // DEBUG

io.of('/game').on('connection', (socket) => {
  socket.emit('establish offset');
  console.log('a user connected to game');
  console.log('user part of rooms: ', socket.rooms);
  socket.on('disconnect', () => {
    console.log('user disconnected from game');
  });
  socket.on('join room', (room) => {
    if (rooms.has(room)) {
      socket.join(room);
      console.log(`User joined room: ${room}`);
      socket.emit('board', rooms.get(room));
    } else if (completedRooms.has(room)) {
      console.log(`User viewed archive room: ${room}`);
      socket.emit('board', completedRooms.get(room));
    }
    else {
      console.log('invalid room')
      socket.emit('invalid room');
    }
    console.log(`User in rooms: `, Array.from(socket.rooms).filter(r => r !== socket.id));
  });
  socket.on('check solves', () => {
    const room: string = Array.from(socket.rooms).filter(r => r !== socket.id)[0];
    if (rooms.has(room)) {
      function updateClients(questionIndex: number, playerIndex: number, timestamp: number) {
        io.of('/game').to(room).emit('update square', questionIndex, playerIndex, timestamp);
      }
      function updateClientsWin(winner: number, endTime: Date) {
        io.of('/game').to(room).emit('win', winner, endTime);
        completedRooms.set(room, rooms.get(room)!);
        rooms.delete(room);
      }
      rooms.get(room)!.checkSolves(updateClients, updateClientsWin);
    } else {
      console.log('Checking solves in invalid room: ', room);
    }
  });
  socket.on('player ready', (player, readyState) => {
    const room: string = Array.from(socket.rooms).filter(r => r !== socket.id)[0];
    if (rooms.has(room)) {
      let board = rooms.get(room)!
      if (board.ready.every(val => val)) {
        console.log('Already locked into ready');
        return;
      }
      board.ready[player] = readyState;
      io.of('/game').to(room).emit('player ready', player, readyState);
      if (board.ready.every(val => val)) {
        io.of('/game').to(room).emit('readying board');
        startGame(board);
      }
    } else {
      console.log('Player readying in invalid room: ', room);
    }
  })
});

async function startGame(board: Board) {
  await board.initBoard();
  board.startTime = new Date();
  io.of('/game').to(board.roomId).emit('board', board);
}

const inactivityTimeout = 1000 * 60 * 60;
const maxRoomCount = 10;
async function newRoom(board: Board): Promise<string> {
  if (rooms.size >= maxRoomCount) {
    let isRoomDeleted = false;
    for (let [key, value] of rooms) {
      if (value.lastActionTime.getTime() + inactivityTimeout < Date.now()) {
        console.log(`Deleting room ${key} due to inactivity.`);
        rooms.delete(key);
        isRoomDeleted = true;
        break;
      }
    }
    if (!isRoomDeleted) {
      console.log('Cannot create new room, maximum limit reached and no room available for deletion.');
      throw new Error('Maximum room limit reached, please try again later.');
    }
  }
  board.roomId = nanoid();
  try {
    await board.players[0].getImageUrl();
    await board.players[1].getImageUrl();
  }
  catch (error) {
    console.error('Error fetching player images:', error);
    throw new Error('Failed to fetch player images. Please check player names.');
  }
  console.log(board);
  rooms.set(board.roomId, board);
  return board.roomId;
}

export { newRoom };