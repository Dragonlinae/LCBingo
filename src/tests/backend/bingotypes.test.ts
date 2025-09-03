import { expect, it, describe, vi, beforeEach, beforeAll } from 'vitest';
import {
  Player,
  Question,
  QuestionFilter,
  Board,
  Submission,
} from '../../types/bingotypes';

// Mock fetch class, inherit argument types from the actual fetch function
global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
  if (input == 'https://leetcode.com/graphql/') {
    if (init?.body?.toString().includes('userAvatar')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            ok: true,
            data: {
              matchedUser: {
                username: 'Sylvie',
                profile: {
                  userAvatar: 'https://localhost/images/SylvieAvatar.png',
                },
              },
            },
          }),
        ),
      );
    } else if (init?.body?.toString().includes('recentAcSubmissions')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            ok: true,
            data: {
              recentAcSubmissionList: [
                {
                  id: 3,
                  titleSlug: 'question-3',
                  timestamp: 10,
                  statusDisplay: 'Accepted',
                },
                {
                  id: 2,
                  titleSlug: 'question-2',
                  timestamp: 9,
                  statusDisplay: 'Accepted',
                },
                {
                  id: 1,
                  titleSlug: 'question-1',
                  timestamp: 8,
                  statusDisplay: 'Accepted',
                },
              ],
            },
          }),
        ),
      );
    } else if (init?.body?.toString().includes('questionDetail')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            ok: true,
            data: {
              question: {
                questionId: 1,
                questionFrontendId: 1001,
                title: 'Question 1',
                titleSlug: 'question-1',
                isPaidOnly: false,
                difficulty: 'EASY',
                categoryTitle: 'algorithms',
              },
            },
          }),
        ),
      );
    }
  }
  console.log(init?.body?.toString());
  return Promise.reject(new Error('Unknown URL'));
});

describe('Player class', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a player with correct properties', async () => {
    const player = new Player('Sylvie');
    const imageurl = await player.getImageUrl();
    expect(player.name).toBe('Sylvie');
    expect(player.url).toBe('https://leetcode.com/u/Sylvie/');
    expect(imageurl).toBe('https://localhost/images/SylvieAvatar.png');
    expect(player.imageurl).toBe('https://localhost/images/SylvieAvatar.png');
    expect(global.fetch).toBeCalledTimes(1);
  });

  it('fetches recent accepted submissions', async () => {
    const player = new Player('Sylvie');
    const submissions = await player.getRecentAC();
    expect(global.fetch).toBeCalledTimes(1);
    expect(submissions.length).toBe(3);
    submissions.forEach((submission, index) => {
      expect(submission.id).toBe(3 - index);
      expect(submission.titleSlug).toBe(`question-${3 - index}`);
      expect(submission.timestamp).toBe(10 - index);
      expect(submission.statusDisplay).toBe('Accepted');
    });
  });
});

describe('Question class', () => {
  it('creates a question with correct properties', () => {
    const question = new Question(
      1,
      1001,
      'Question 1',
      'question-1',
      false,
      'EASY',
      'algorithms',
    );
    expect(question.questionId).toBe(1);
    expect(question.questionFrontendId).toBe(1001);
    expect(question.title).toBe('Question 1');
    expect(question.titleSlug).toBe('question-1');
    expect(question.isPaidOnly).toBe(false);
    expect(question.difficulty).toBe('EASY');
    expect(question.categoryTitle).toBe('algorithms');
    expect(question.url).toBe('https://leetcode.com/problems/question-1/');
  });

  it('creates a question from JSON', () => {
    const json = {
      questionId: 1,
      questionFrontendId: 1001,
      title: 'Question 1',
      titleSlug: 'question-1',
      isPaidOnly: true,
      difficulty: 'MEDIUM',
      categoryTitle: 'algorithms',
    };
    const question = Question.fromJSON(json);
    expect(question.questionId).toBe(1);
    expect(question.titleSlug).toBe('question-1');
    expect(question.isPaidOnly).toBe(true);
    expect(question.difficulty).toBe('MEDIUM');
  });

  it('creates a question from title slug', async () => {
    const question = await Question.fromTitleSlug('question-1');
    expect(question.questionId).toBe(1);
    expect(question.questionFrontendId).toBe(1001);
    expect(question.title).toBe('Question 1');
    expect(question.titleSlug).toBe('question-1');
    expect(question.isPaidOnly).toBe(false);
    expect(question.difficulty).toBe('EASY');
    expect(question.categoryTitle).toBe('algorithms');
  });
});

describe('QuestionFilter class', () => {
  it('creates a filter with default values', () => {
    const filter = new QuestionFilter();
    expect(filter.category).toBe('algorithms');
    expect(filter.difficulty).toEqual(['EASY', 'MEDIUM', 'HARD']);
    expect(filter.isFreeOnly).toBe(true);
  });

  it('creates a filter with custom values', () => {
    const filter = new QuestionFilter('algorithms', ['MEDIUM'], false);
    expect(filter.category).toBe('algorithms');
    expect(filter.difficulty).toEqual(['MEDIUM']);
    expect(filter.isFreeOnly).toBe(false);
  });

  it('converts filter to JSON', () => {
    const filter = new QuestionFilter('algorithms', ['HARD'], true);
    const json = filter.toJSON();
    expect(json.categorySlug).toBe('algorithms');
    expect(json.filtersV2.difficultyFilter.difficulties).toEqual(['HARD']);
    expect(json.filtersV2.premiumFilter.premiumStatus).toEqual(['NOT_PREMIUM']);
    expect(json.filtersV2.filterCombineType).toBe('ALL');
  });
});

describe('Submission class', () => {
  it('creates a submission with correct properties', () => {
    const submission = new Submission(
      42,
      'some-question',
      1234567890,
      'Accepted',
    );
    expect(submission.id).toBe(42);
    expect(submission.titleSlug).toBe('some-question');
    expect(submission.timestamp).toBe(1234567890);
    expect(submission.statusDisplay).toBe('Accepted');
  });
});

describe('Board class', () => {
  let player1: Player;
  let player2: Player;
  let board: Board;

  beforeEach(() => {
    player1 = new Player('Alice');
    player2 = new Player('Bob');
    board = new Board(player1, player2, 2);
    board.isBoardInitialized = true;
    board.timestamp = [
      [Infinity, Infinity],
      [Infinity, Infinity],
      [Infinity, Infinity],
      [Infinity, Infinity],
    ];
  });

  it('throws error for invalid board size', () => {
    expect(() => new Board(player1, player2, 0)).toThrow();
    expect(() => new Board(player1, player2, 6)).toThrow();
  });

  it('throws error for same player names', () => {
    expect(
      () => new Board(new Player('Alice'), new Player('Alice'), 2),
    ).toThrow();
  });

  it('checkWin returns -1 when no winner', () => {
    expect(board.checkWin()).toBe(-1);
  });

  it('sets winner when blackout condition met', () => {
    board.winCondition = Board.WinConditions.BLACKOUT;
    board.timestamp = [
      [1, Infinity],
      [2, Infinity],
      [3, Infinity],
      [4, Infinity],
    ];
    expect(board.checkWin()).toBe(0);
    expect(board.isBoardCompleted).toBe(true);
  });

  it('sets winner when bingo condition met', () => {
    board.winCondition = Board.WinConditions.BINGO;
    board.timestamp = [
      [1, Infinity],
      [Infinity, Infinity],
      [Infinity, 5],
      [Infinity, 3],
    ];
    expect(board.checkWin()).toBe(1);
    expect(board.isBoardCompleted).toBe(true);
  });

  it('sets winner when blackout condition met', () => {
    board.winCondition = Board.WinConditions.BLACKOUT;
    board.timestamp = [
      [1, 2],
      [3, 4],
      [5, 6],
      [7, Infinity],
    ];
    expect(board.checkWin()).toBe(0);
    expect(board.isBoardCompleted).toBe(true);
  });

  it('initBoard initializes questions and timestamps', async () => {
    board.isBoardInitialized = false;
    vi.spyOn(Board, 'getRandomQuestion').mockResolvedValue(
      new Question(1, 1, 'Q', 'q', false, 'EASY', 'algorithms'),
    );
    await board.initBoard();
    expect(board.questions.length).toBe(4);
    expect(board.isBoardInitialized).toBe(true);
    expect(board.timestamp.length).toBe(4);
  });
});
