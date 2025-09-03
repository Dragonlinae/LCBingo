import type { Board } from '../interfaces/bingotypes.d.ts';
import type { Socket } from 'socket.io-client';
import { setupBoard, setupPanels, updateSquare } from './utils/bingoBoard.js';
import {
  alertWin,
  introBlock,
  introReveal,
  updateTimer,
} from './utils/bingoPeripherals.js';
import createThemeToggle from './utils/themes.js';

createThemeToggle();

declare var io: (url: string | undefined) => Socket;
declare var JSConfetti: any;

const jsConfetti = new JSConfetti();

let board: Board;
const socket: Socket = io('/game');

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const roomId = urlParams.get('roomId') || '-1';

socket.emit('join room', roomId);

socket.on('invalid room', () => {
  const boardDiv = document.getElementById('bingoBoardContainer')!;
  let invalidRoomText = document.createElement('p');
  invalidRoomText.innerText = 'Invalid Room Code';
  boardDiv.appendChild(invalidRoomText);

  const refreshButton = document.getElementById('refreshBoard')!;
  refreshButton.textContent = 'Return to Home';
  refreshButton.onclick = function () {
    window.location.href = '/';
  };
});

socket.on('readying board', () => {
  introBlock();
});

const boardDiv = document.getElementById('bingoBoardContainer')!;
socket.on('board', (_board: Board) => {
  _board.startTime = new Date(_board.startTime);
  board = _board;
  console.log('Received board:', board);
  const p1Info = document.getElementById('p1Info')!;
  const p2Info = document.getElementById('p2Info')!;
  const infoPanelBL = document.getElementById('infoPanelBL')!;
  const infoPanelBR = document.getElementById('infoPanelBR')!;
  const overlayLeft = document.getElementById('overlay-left')!;
  const overlayRight = document.getElementById('overlay-right')!;
  setupPanels(
    board,
    p1Info,
    p2Info,
    infoPanelBL,
    infoPanelBR,
    overlayLeft,
    overlayRight,
  );
  if (board.isBoardInitialized) {
    setupBoard(board, boardDiv);
    introReveal();
    const timerTimer = setInterval(
      function (board: Board) {
        updateTimer(board, timerTimer);
      },
      1000,
      board,
    );
    updateTimer(board, timerTimer);
  }
  if (board.winner !== -1) {
    alertWin(board.winner);
  }
});

socket.on(
  'update square',
  (questionIndex: number, playerIndex: number, timestamp: number) => {
    const squareHtml = document.getElementById('bingoBoardContainer')!.children[
      questionIndex
    ] as HTMLElement;
    board.timestamp[questionIndex][playerIndex] = timestamp;
    updateSquare(
      board,
      squareHtml,
      board.timestamp[questionIndex][0],
      board.timestamp[questionIndex][1],
      board.winCondition,
    );
  },
);

socket.on('win', (winner, endTime) => {
  board.winner = winner;
  board.endTime = new Date(endTime);
  board.isBoardCompleted = true;
  alertWin(winner);
});

const p1Ready = document.getElementById('p1Ready') as HTMLButtonElement;
const p2Ready = document.getElementById('p2Ready') as HTMLButtonElement;
socket.on('player ready', (player, readyState) => {
  if (player === 0) {
    p1Ready.textContent = readyState ? 'Ready' : 'Not Ready';
    board.ready[0] = readyState;
  } else if (player === 1) {
    p2Ready.textContent = readyState ? 'Ready' : 'Not Ready';
    board.ready[1] = readyState;
  }
});

p1Ready.onclick = function () {
  board.ready[0] = !board.ready[0];
  socket.emit('player ready', 0, board.ready[0]);
};

p2Ready.onclick = function () {
  board.ready[1] = !board.ready[1];
  socket.emit('player ready', 1, board.ready[1]);
};

const infoUrl = document.getElementById('infoUrl') as HTMLButtonElement;
infoUrl.onclick = async function () {
  await navigator.clipboard.writeText(window.location.href);
  infoUrl.textContent = 'Copied!';
  setTimeout(function () {
    infoUrl.textContent = 'Copy URL';
  }, 2000);
};

document.getElementById('refreshBoard')!.onclick = function () {
  socket.emit('check solves');
};
