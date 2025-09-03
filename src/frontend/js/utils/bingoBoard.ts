import type { Board } from '../../interfaces/bingotypes.js';
import { formatTimestamp } from './timestamp.js';

function setupBoard(board: Board, boardDiv: HTMLElement) {
  board.timestamp.forEach((timestamp) => {
    timestamp[0] = timestamp[0] ?? Infinity;
    timestamp[1] = timestamp[1] ?? Infinity;
  });

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
      board,
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

function updateSquare(
  board: Board,
  square: HTMLElement,
  player1Time: number,
  player2Time: number,
  winCon: number,
) {
  if (winCon === 2) {
    if (player1Time === Infinity && player2Time === Infinity) {
      square.style.background = '';
    } else if (player1Time < Infinity && player2Time < Infinity) {
      console.log(player1Time, player2Time);
      square.style.background =
        'repeating-linear-gradient(45deg, var(--lightred), var(--lightred) 30px, var(--lightblue) 30px, var(--lightblue) 60px)';
    } else if (player1Time < Infinity) {
      square.style.background = 'var(--lightred)';
    } else if (player2Time < Infinity) {
      square.style.background = 'var(--lightblue)';
    }
  } else {
    if (player1Time === Infinity && player2Time === Infinity) {
      square.style.background = '';
    } else if (player1Time < player2Time) {
      square.style.background = 'var(--lightred)';
    } else if (player1Time > player2Time) {
      square.style.background = 'var(--lightblue)';
    } else {
      square.style.background =
        'repeating-linear-gradient(45deg, var(--lightred), var(--lightred) 30px, var(--lightblue) 30px, var(--lightblue) 60px)';
    }
  }

  // update square timestamp
  const bestTime = Math.min(player1Time, player2Time) * 1000;
  console.log(bestTime);
  const ts = square.getElementsByClassName('timestamp')[0];
  // console.log(square, '??', ts);
  if (ts && bestTime < Infinity) {
    ts.classList.remove('hidden');
    ts.textContent = formatTimestamp(bestTime - board.startTime.getTime());
  }
}

function setupPanels(
  board: Board,
  p1Info: HTMLElement,
  p2Info: HTMLElement,
  infoPanelBL: HTMLElement,
  infoPanelBR: HTMLElement,
  overlayLeft: HTMLElement,
  overlayRight: HTMLElement,
) {
  const winCondMap = ['Bingo', 'Lockout', 'Blackout', 'Bingo + Lockout'];
  const p1Name = p1Info.querySelector('#p1Name')!;
  const p1Avatar = p1Info.querySelector('#p1Avatar')! as HTMLImageElement;
  const p1Ready = p1Info.querySelector('#p1Ready')! as HTMLButtonElement;
  // const p1Score = p1Info.querySelector('#p1Score')!;
  const p2Name = p2Info.querySelector('#p2Name')!;
  const p2Avatar = p2Info.querySelector('#p2Avatar')! as HTMLImageElement;
  const p2Ready = p2Info.querySelector('#p2Ready')! as HTMLButtonElement;
  // const p2Score = p2Info.querySelector('#p2Score')!;

  const infoWinCon = infoPanelBL.querySelector('#infoWinCon')!;
  const infoDifficulty = infoPanelBR.querySelector('#infoDifficulty')!;
  const infoSize = infoPanelBR.querySelector('#infoSize')!;
  const infoCategory = infoPanelBR.querySelector('#infoCategory')!;
  const infoFree = infoPanelBR.querySelector('#infoFree')!;
  const overlayLeftText = overlayLeft.querySelector('#overlay-left-text')!;
  const overlayRightText = overlayRight.querySelector('#overlay-right-text')!;

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
    (board.filters.filtersV2.premiumFilter.premiumStatus.length === 1 &&
    board.filters.filtersV2.premiumFilter.premiumStatus[0] === 'NOT_PREMIUM'
      ? 'Free'
      : 'Premium');

  if (board.ready[0]) {
    p1Ready.textContent = 'Ready';
  }
  if (board.ready[1]) {
    p2Ready.textContent = 'Ready';
  }
}

export { updateSquare, setupBoard, setupPanels };
