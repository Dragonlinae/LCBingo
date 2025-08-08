import type { Board } from '../interfaces/bingotypes.d.ts';
import type { Socket } from 'socket.io-client';
import { formatTimestamp } from './util.js';

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

socket.on('board', (_board: Board) => {
  _board.startTime = new Date(_board.startTime);
  board = _board;
  console.log('Received board:', board);
  setupPanels();
  if (board.isBoardInitialized) {
    setupBoard();
    introReveal();
  }
  if (board.winner != -1) {
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
  if (player == 0) {
    p1Ready.textContent = readyState ? 'Ready' : 'Not Ready';
    board.ready[0] = readyState;
  } else if (player == 1) {
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

function updateSquare(
  square: HTMLElement,
  player1Time: number,
  player2Time: number,
  winCon: number,
) {
  if (winCon == 2) {
    if (player1Time == Infinity && player2Time == Infinity) {
      square.style.backgroundColor = '';
    } else if (player1Time < Infinity && player2Time < Infinity) {
      square.style.backgroundColor = '#a855f7';
    } else if (player1Time < Infinity) {
      square.style.backgroundColor = '#f87171';
    } else if (player2Time < Infinity) {
      square.style.backgroundColor = '#7dd3fc';
    }
  } else {
    if (player1Time == Infinity && player2Time == Infinity) {
      square.style.backgroundColor = '';
    } else if (player1Time < player2Time) {
      square.style.backgroundColor = '#f87171';
    } else if (player1Time > player2Time) {
      square.style.backgroundColor = '#7dd3fc';
    } else {
      square.style.backgroundColor = '#a855f7';
    }
  }

  // update square timestamp
  const bestTime = Math.min(player1Time, player2Time) * 1000;
  console.log(bestTime);
  const ts = square.getElementsByClassName('timestamp')[0];
  console.log(square, '??', ts);
  if (ts && bestTime < Infinity) {
    ts.classList.remove('hidden');
    ts.textContent = formatTimestamp(bestTime - board.startTime.getTime());
  }
}

function setupBoard() {
  board.timestamp.forEach((timestamp) => {
    timestamp[0] = timestamp[0] ?? Infinity;
    timestamp[1] = timestamp[1] ?? Infinity;
  });

  const boardDiv = document.getElementById('bingoBoardContainer')!;
  console.log(board.size);
  modifySquareGrid(boardDiv, board.size);
  boardDiv.innerHTML = '';
  for (let i = 0; i < board.size * board.size; ++i) {
    const square = document.createElement('button');
    square.classList.add('bingo-square');
    const squareText = document.createElement('p');
    squareText.classList.add('square-text');
    squareText.textContent = board.questions[i].title;
    square.appendChild(squareText);
    square.onclick = () => {
      window.open(board.questions[i].url, '_blank');
    };
    const timestamp = document.createElement('p');
    timestamp.classList.add('hidden', 'timestamp');
    square.append(timestamp);
    updateSquare(
      square,
      board.timestamp[i][0],
      board.timestamp[i][1],
      board.winCondition,
    );
    boardDiv.appendChild(square);
  }
}

function modifySquareGrid(gridContainer: HTMLElement, size: number) {
  gridContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  gridContainer.style.gridTemplateRows = `repeat(${size}, 1fr)`;
}

function setupPanels() {
  const winCondMap = ['Bingo', 'Lockout', 'Blackout', 'Bingo + Lockout'];
  const p1Name = document.getElementById('p1Name')!;
  const p1Avatar = document.getElementById('p1Avatar')! as HTMLImageElement;
  // const p1Score = document.getElementById("p1Score")!;
  const p2Name = document.getElementById('p2Name')!;
  const p2Avatar = document.getElementById('p2Avatar')! as HTMLImageElement;
  // const p2Score = document.getElementById("p2Score")!;

  const infoDifficulty = document.getElementById('infoDifficulty')!;
  const infoWinCon = document.getElementById('infoWinCon')!;
  const infoSize = document.getElementById('infoSize')!;
  const infoCategory = document.getElementById('infoCategory')!;
  const infoFree = document.getElementById('infoFree')!;

  const overlayLeftText = document.getElementById('overlay-left-text')!;
  const overlayRightText = document.getElementById('overlay-right-text')!;

  p1Name.textContent = board.players[0].name;
  p1Avatar.src = board.players[0].imageurl;
  overlayLeftText.textContent = board.players[0].name + '\nV\n ';

  p2Name.textContent = board.players[1].name;
  p2Avatar.src = board.players[1].imageurl;
  overlayRightText.textContent = ' \nS\n' + board.players[1].name;

  infoDifficulty.textContent =
    'Difficulty: ' +
    board.filters.filtersV2.difficultyFilter.difficulties
      .map(
        (elem: string) =>
          elem.charAt(0).toUpperCase() + elem.slice(1).toLowerCase(),
      )
      .join(', ');
  infoWinCon.textContent = 'Win Condition: ' + winCondMap[board.winCondition];
  infoSize.textContent = 'Size: ' + board.size + ' x ' + board.size;
  infoCategory.textContent = 'Category: ' + board.filters.categorySlug;
  infoFree.textContent =
    'Access: ' +
    (board.filters.filtersV2.premiumFilter.premiumStatus.length == 1 &&
    board.filters.filtersV2.premiumFilter.premiumStatus[0] == 'NOT_PREMIUM'
      ? 'Free'
      : 'Premium');

  if (board.ready[0]) {
    p1Ready.textContent = 'Ready';
  }
  if (board.ready[1]) {
    p2Ready.textContent = 'Ready';
  }
}

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

function alertWin(winner: number) {
  if (winner >= 0) {
    // alert(`Player ${board.players[winner].name} won!`);
    if (document.hasFocus()) {
      animateWin(winner);
    } else {
      window.addEventListener(
        'focus',
        () => {
          animateWin(winner);
        },
        { once: true },
      );
    }
  } else if (winner == -2) {
    animateDraw();
  }
  const refreshButton = document.getElementById(
    'refreshBoard',
  )! as HTMLButtonElement;
  refreshButton.disabled = true;
}

const crownImage = document.getElementById('crown') as HTMLImageElement;
function animateWin(winner: number) {
  jsConfetti.addConfetti({
    confettiRadius: 10,
    confettiNumber: 500,
  });
  let targetPlayerImage = document.getElementById(
    `p${winner + 1}Avatar`,
  ) as HTMLImageElement;
  targetPlayerImage.classList.add('winner');
  targetPlayerImage.before(crownImage);
  crownImage.style.left = -crownImage.width / 4 + 'px';
  crownImage.style.top = -crownImage.height / 4 + 'px';
  crownImage.style.opacity = '1';
  crownImage.style.scale = '1';
}

const drawImage = document.getElementById('draw') as HTMLImageElement;
function animateDraw() {
  drawImage.style.opacity = '1';
  drawImage.style.scale = '1';
}

const overlayLeft = document.getElementById('overlay-left')!;
const overlayRight = document.getElementById('overlay-right')!;
function introBlock() {
  overlayLeft.hidden = false;
  overlayRight.hidden = false;
  overlayLeft.style.animation = 'overlay-left-anim-in 0.5s ease-out forwards';
  overlayRight.style.animation = 'overlay-right-anim-in 0.5s ease-out forwards';
}
function introReveal() {
  overlayLeft.style.animation = 'overlay-left-anim-out 0.5s ease-out forwards';
  overlayRight.style.animation =
    'overlay-right-anim-out 0.5s ease-out forwards';
}

const infoTime = document.getElementById('infoTime')!;
function updateTimer() {
  if (!board) {
    return;
  }
  if (board.isBoardCompleted) {
    const diff = board.endTime.getTime() - board.startTime.getTime();
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const displayHours = String(hours).padStart(2, '0');
    const displayMinutes = String(minutes).padStart(2, '0');
    const displaySeconds = String(seconds).padStart(2, '0');

    infoTime.textContent =
      'Time: ' + displayHours + ':' + displayMinutes + ':' + displaySeconds;
    timerTimer.close();
  }
  const now = new Date();
  const diff = now.getTime() - board.startTime.getTime();

  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const displayHours = String(hours).padStart(2, '0');
  const displayMinutes = String(minutes).padStart(2, '0');
  const displaySeconds = String(seconds).padStart(2, '0');

  infoTime.textContent =
    'Time: ' + displayHours + ':' + displayMinutes + ':' + displaySeconds;
}

updateTimer();
const timerTimer = setInterval(updateTimer, 1000);
