import { expect, it, describe, vi, beforeEach, beforeAll } from 'vitest';
import {
  updateSquare,
  setupBoard,
  setupPanels,
} from '../../frontend/js/utils/bingoBoard.ts';
import {
  Board,
  Question,
  Player,
  QuestionFilter,
} from '../../types/bingotypes.ts';

class MockQuestionClass implements Partial<Question> {
  title: string;
  url: string;
  constructor(title: string = 'title', url: string = 'url') {
    this.title = title;
    this.url = url;
  }
}

function MockQuestion(
  ...args: ConstructorParameters<typeof MockQuestionClass>
): Question {
  return new MockQuestionClass(...args) as Question;
}

class MockPlayerClass implements Partial<Player> {
  name: string;
  imageurl: string;
  constructor(name: string = '', imageurl: string = '') {
    this.name = name;
    this.imageurl = imageurl;
  }
}
function MockPlayer(
  ...args: ConstructorParameters<typeof MockPlayerClass>
): Player {
  return new MockPlayerClass(...args) as Player;
}

class MockBoardClass implements Partial<Board> {
  timestamp: [number, number][];
  size: number;
  questions: Question[];
  startTime: Date = new Date(0);
  players: [Player, Player] = [MockPlayer(), MockPlayer()];
  winCondition: number;
  filters: any = {
    categorySlug: 'category',
    filtersV2: {
      difficultyFilter: {
        difficulties: ['EASY', 'MEDIUM', 'HARD'],
      },
      premiumFilter: {
        premiumStatus: ['NOT_PREMIUM'],
      },
      filterCombineType: 'ALL',
    },
  };
  ready: [boolean, boolean] = [false, false];

  constructor(
    timestamp: [number, number][] = [],
    size: number = 0,
    questions: Question[] = [],
    winCondition: number = 0,
  ) {
    this.timestamp = timestamp;
    this.size = size;
    this.questions = questions;
    this.winCondition = winCondition;
  }

  // board.startTime.getTime() return a number without using Date object
}

function MockBoard(
  ...args: ConstructorParameters<typeof MockBoardClass>
): Board {
  return new MockBoardClass(...args) as unknown as Board;
}

describe('setupBoard', () => {
  let board: Board;
  let boardDiv: HTMLDivElement;
  beforeAll(() => {
    boardDiv = document.createElement('div');
  });
  beforeEach(() => {
    board = MockBoard();
    window.open = vi.fn();
  });

  it('adds question to board on setup', () => {
    board.size = 1;
    board.timestamp = [[Infinity, Infinity]];
    board.questions = [MockQuestion('A Question', 'A URL')];

    setupBoard(board, boardDiv);
    expect(boardDiv.style.gridTemplateColumns).toBe('repeat(1, 1fr)');
    expect(boardDiv.style.gridTemplateRows).toBe('repeat(1, 1fr)');
    expect(boardDiv.children[0].textContent).toBe('A Question');
  });

  it('attaches url to question on board on setup', () => {
    board.size = 1;
    board.timestamp = [[Infinity, Infinity]];
    board.questions = [MockQuestion('A Question', 'A URL')];

    setupBoard(board, boardDiv);
    (boardDiv.children[0] as HTMLButtonElement).click();
    expect(window.open).toHaveBeenCalledWith('A URL', '_blank');
  });

  it('sets up larger board', () => {
    board.size = 5;
    board.timestamp = Array(25).fill([Infinity, Infinity]);
    for (let i = 0; i < 25; ++i) {
      board.questions.push(MockQuestion(`Question ${i}`, `URL ${i}`));
    }

    setupBoard(board, boardDiv);
    expect(boardDiv.style.gridTemplateColumns).toBe('repeat(5, 1fr)');
    expect(boardDiv.style.gridTemplateRows).toBe('repeat(5, 1fr)');
    for (let i = 0; i < 25; ++i) {
      expect(boardDiv.children[i].textContent).toBe(`Question ${i}`);
    }
  });

  it('sets up larger board URL', () => {
    board.size = 5;
    board.timestamp = Array(25).fill([Infinity, Infinity]);
    for (let i = 0; i < 25; ++i) {
      board.questions.push(MockQuestion(`Question ${i}`, `URL ${i}`));
    }

    setupBoard(board, boardDiv);
    for (let i = 0; i < 25; ++i) {
      (boardDiv.children[i] as HTMLButtonElement).click();
    }
    for (let i = 0; i < 25; ++i) {
      expect(window.open).nthCalledWith(i + 1, `URL ${i}`, '_blank');
    }
  });
});

describe('updateSquare', () => {
  let board: Board;
  let square: HTMLButtonElement;
  let timestamp: HTMLParagraphElement;
  beforeAll(() => {
    square = document.createElement('button');
    timestamp = document.createElement('p');
    timestamp.classList.add('hidden', 'timestamp');
    square.appendChild(timestamp);
  });
  beforeEach(() => {
    board = MockBoard();
    window.open = vi.fn();
  });

  it('updates square for no solves', () => {
    board.size = 1;
    board.timestamp = [[Infinity, Infinity]];
    board.questions = [MockQuestion('A Question', 'A URL')];
    board.startTime = new Date(0);
    updateSquare(board, square, Infinity, Infinity, 2);

    expect(square.style.background).toBe('');
    expect(
      square
        .getElementsByClassName('timestamp')[0]
        .classList.contains('hidden'),
    ).toBeTruthy();
  });

  it('updates square for player one solve', () => {
    board.size = 1;
    board.timestamp = [[Infinity, Infinity]];
    board.questions = [MockQuestion('A Question', 'A URL')];
    board.startTime = new Date(0);
    updateSquare(board, square, 1, Infinity, 2);

    expect(square.style.background).toBe('var(--lightred)');
    expect(
      square
        .getElementsByClassName('timestamp')[0]
        .classList.contains('hidden'),
    ).toBeFalsy();
    expect(square.getElementsByClassName('timestamp')[0].textContent).toBe(
      '00:00:01',
    );
  });

  it('updates square for player two solve', () => {
    board.size = 1;
    board.timestamp = [[Infinity, Infinity]];
    board.questions = [MockQuestion('A Question', 'A URL')];
    board.startTime = new Date(0);
    updateSquare(board, square, Infinity, 2, 2);

    expect(square.style.background).toBe('var(--lightblue)');
    expect(
      square
        .getElementsByClassName('timestamp')[0]
        .classList.contains('hidden'),
    ).toBeFalsy();
    expect(square.getElementsByClassName('timestamp')[0].textContent).toBe(
      '00:00:02',
    );
  });

  it('updates square for both players solve (non tie)', () => {
    board.size = 1;
    board.timestamp = [[Infinity, Infinity]];
    board.questions = [MockQuestion('A Question', 'A URL')];
    board.startTime = new Date(0);
    updateSquare(board, square, 1, 2, 1);

    console.log('Square:', square.style.background);

    expect(square.style.background).toBe('var(--lightred)');
    expect(
      square
        .getElementsByClassName('timestamp')[0]
        .classList.contains('hidden'),
    ).toBeFalsy();
    expect(square.getElementsByClassName('timestamp')[0].textContent).toBe(
      '00:00:01',
    );
  });

  // Happy-dom does not support repeating-linear-gradient yet I think
  it.skip('updates square for both players solve (blackout)', () => {
    board.size = 1;
    board.timestamp = [[Infinity, Infinity]];
    board.questions = [MockQuestion('A Question', 'A URL')];
    board.startTime = new Date(0);
    updateSquare(board, square, 1, 2, 2);

    console.log('Square:', square.style.background);

    expect(square.style.background).toBe(
      'repeating-linear-gradient(45deg, var(--lightred), var(--lightred) 30px, var(--lightblue) 30px, var(--lightblue) 60px)',
    );
    expect(
      square
        .getElementsByClassName('timestamp')[0]
        .classList.contains('hidden'),
    ).toBeFalsy();
    expect(square.getElementsByClassName('timestamp')[0].textContent).toBe(
      '00:00:01',
    );
  });
});

const dummyHtml = {
  p1Info: () => `
    <div id="p1Info">
      <p id="p1Name"></p>
      <div class="avatar-container">
        <img id="p1Avatar" src="" alt="Player 1 Avatar" class="avatar" />
      </div>
      <p id="p1Score"></p>
      <button id="p1Ready">Not Ready</button>
    </div>
  `,
  p2Info: () => `
    <div id="p2Info">
      <p id="p2Name"></p>
      <div class="avatar-container">
        <img id="p2Avatar" src="" alt="Player 2 Avatar" class="avatar" />
      </div>
      <p id="p2Score"></p>
      <button id="p2Ready">Not Ready</button>
    </div>
  `,
  infoPanelBL: () => `
    <div id="bottomleft" class="left-corner">
      <button id="infoUrl">Copy URL</button>
      <p id="infoWinCon">Win Condition:</p>
      <p id="infoTime">Time:</p>
    </div>
  `,
  infoPanelBR: () => `
    <div id="bottomright" class="right-corner">
      <p id="infoDifficulty">Difficulty:</p>
      <p id="infoSize">Size:</p>
      <p id="infoCategory">Category:</p>
      <p id="infoFree">Free Questions Only:</p>
    </div>
  `,
  overlayLeft: () => `
    <div id="overlay-left" class="overlay">
      <p id="overlay-left-text"></p>
    </div>
  `,
  overlayRight: () => `
    <div id="overlay-right" class="overlay">
      <p id="overlay-right-text"></p>
    </div>
  `,
};

describe('updatePanels', () => {
  let board: Board;
  let p1Info: HTMLElement;
  let p2Info: HTMLElement;
  let infoPanelBL: HTMLElement;
  let infoPanelBR: HTMLElement;
  let overlayLeft: HTMLElement;
  let overlayRight: HTMLElement;
  beforeAll(() => {
    board = MockBoard();
    window.open = vi.fn();
    p1Info = document.createElement('div');
    p1Info.innerHTML = dummyHtml.p1Info();
    p2Info = document.createElement('div');
    p2Info.innerHTML = dummyHtml.p2Info();
    infoPanelBL = document.createElement('div');
    infoPanelBL.innerHTML = dummyHtml.infoPanelBL();
    infoPanelBR = document.createElement('div');
    infoPanelBR.innerHTML = dummyHtml.infoPanelBR();
    overlayLeft = document.createElement('div');
    overlayLeft.innerHTML = dummyHtml.overlayLeft();
    overlayRight = document.createElement('div');
    overlayRight.innerHTML = dummyHtml.overlayRight();
    board.players[0].name = 'Player 1';
    board.players[0].imageurl = 'https://localhost:4002/p1.png';
    board.players[1].name = 'Player 2';
    board.players[1].imageurl = 'https://localhost:4002/p2.png';
  });

  it('sets up player panels', () => {
    board.size = 1;
    board.timestamp = [[Infinity, Infinity]];
    board.questions = [MockQuestion('A Question', 'A URL')];
    board.startTime = new Date(0);
    setupPanels(
      board,
      p1Info,
      p2Info,
      infoPanelBL,
      infoPanelBR,
      overlayLeft,
      overlayRight,
    );

    expect(p1Info.querySelector('#p1Name')!.textContent).toBe(
      board.players[0].name,
    );
    expect((p1Info.querySelector('#p1Avatar') as HTMLImageElement).src).toBe(
      board.players[0].imageurl,
    );
    expect(
      overlayLeft.querySelector('#overlay-left-text')!.textContent,
    ).contains(board.players[0].name);
    expect(p2Info.querySelector('#p2Name')!.textContent).toBe(
      board.players[1].name,
    );
    expect((p2Info.querySelector('#p2Avatar') as HTMLImageElement).src).toBe(
      board.players[1].imageurl,
    );
    expect(
      overlayRight.querySelector('#overlay-right-text')!.textContent,
    ).contains(board.players[1].name);
  });

  it('sets up info panels', () => {
    board.size = 1;
    board.timestamp = [[Infinity, Infinity]];
    board.questions = [MockQuestion('A Question', 'A URL')];
    board.startTime = new Date(0);
    board.winCondition = 1;
    board.filters = {
      categorySlug: 'Algorithms',
      filtersV2: {
        difficultyFilter: {
          difficulties: ['EASY', 'MEDIUM', 'HARD'],
        },
        premiumFilter: {
          premiumStatus: ['NOT_PREMIUM'],
        },
        filterCombineType: 'ALL',
      },
    } as unknown as QuestionFilter;
    setupPanels(
      board,
      p1Info,
      p2Info,
      infoPanelBL,
      infoPanelBR,
      overlayLeft,
      overlayRight,
    );

    expect(infoPanelBL.querySelector('#infoWinCon')!.textContent).toBe(
      'Win Condition: Lockout',
    );
    expect(infoPanelBR.querySelector('#infoDifficulty')!.textContent).toBe(
      'Difficulty: Easy, Medium, Hard',
    );
    expect(infoPanelBR.querySelector('#infoSize')!.textContent).toBe(
      'Size: 1 x 1',
    );
    expect(infoPanelBR.querySelector('#infoCategory')!.textContent).toBe(
      'Category: Algorithms',
    );
    expect(infoPanelBR.querySelector('#infoFree')!.textContent).toBe(
      'Access: Free',
    );
  });

  describe('setupPanels ready button', () => {
    beforeEach(() => {
      p1Info.querySelector('#p1Ready')!.textContent = 'Not Ready';
      p2Info.querySelector('#p2Ready')!.textContent = 'Not Ready';
    });
    it('sets player 1 ready', () => {
      board.ready[0] = true;
      board.ready[1] = false;
      setupPanels(
        board,
        p1Info,
        p2Info,
        infoPanelBL,
        infoPanelBR,
        overlayLeft,
        overlayRight,
      );

      expect(
        (p1Info.querySelector('#p1Ready') as HTMLButtonElement).textContent,
      ).toBe('Ready');
      expect(
        (p2Info.querySelector('#p2Ready') as HTMLButtonElement).textContent,
      ).toBe('Not Ready');
    });

    it('sets player 2 ready', () => {
      board.ready[0] = false;
      board.ready[1] = true;
      setupPanels(
        board,
        p1Info,
        p2Info,
        infoPanelBL,
        infoPanelBR,
        overlayLeft,
        overlayRight,
      );

      expect(
        (p1Info.querySelector('#p1Ready') as HTMLButtonElement).textContent,
      ).toBe('Not Ready');
      expect(
        (p2Info.querySelector('#p2Ready') as HTMLButtonElement).textContent,
      ).toBe('Ready');
    });

    it('sets both players ready', () => {
      board.ready[0] = true;
      board.ready[1] = true;
      setupPanels(
        board,
        p1Info,
        p2Info,
        infoPanelBL,
        infoPanelBR,
        overlayLeft,
        overlayRight,
      );

      expect(
        (p1Info.querySelector('#p1Ready') as HTMLButtonElement).textContent,
      ).toBe('Ready');
      expect(
        (p2Info.querySelector('#p2Ready') as HTMLButtonElement).textContent,
      ).toBe('Ready');
    });
  });
});
