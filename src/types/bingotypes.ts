import type * as BingoInterfaces from '../frontend/interfaces/bingotypes';

/**
 * Represents a LeetCode question with relevant metadata and utility methods.
 *
 * @example
 * ```typescript
 * // Creating a Question from JSON
 * const question = Question.fromJSON(jsonData);
 *
 * // Fetching a Question by titleSlug
 * const question = await Question.fromTitleSlug('add-two-integers');
 *
 * // Getting the URL of the question
 * const url = question.getURL();
 * ```
 */
class Question implements BingoInterfaces.Question {
  questionId: number;
  questionFrontendId: number;
  title: string;
  titleSlug: string;
  isPaidOnly: boolean;
  difficulty: string;
  categoryTitle: string;
  url: string;

  constructor(
    questionId: number,
    questionFrontendId: number,
    title: string,
    titleSlug: string,
    isPaidOnly: boolean,
    difficulty: string,
    categoryTitle: string,
  ) {
    this.questionId = questionId;
    this.questionFrontendId = questionFrontendId;
    this.title = title;
    this.titleSlug = titleSlug;
    this.isPaidOnly = isPaidOnly;
    this.difficulty = difficulty;
    this.categoryTitle = categoryTitle;
    this.url = `https://leetcode.com/problems/${this.titleSlug}/`;
  }

  /**
   * Creates a Question instance from a JSON object.
   *
   * @param json - The JSON object containing question data.
   * @returns A Question instance.
   */
  static fromJSON(json: any): Question {
    return new Question(
      json.questionId,
      json.questionFrontendId,
      json.title,
      json.titleSlug,
      json.isPaidOnly,
      json.difficulty,
      json.categoryTitle,
    );
  }

  /**
   * Fetches a Question from LeetCode by its titleSlug.
   *
   * @param titleSlug - The slug of the question to fetch.
   * @returns A Promise that resolves to a Question object.
   */
  static fromTitleSlug(titleSlug: string): Promise<Question> {
    return fetch(`https://leetcode.com/graphql/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query questionDetail($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              questionId
              questionFrontendId
              title
              titleSlug
              isPaidOnly
              difficulty
              categoryTitle
            }
          }
        `,
        variables: {
          titleSlug: titleSlug,
        },
        operationName: 'questionDetail',
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        return Question.fromJSON(data.data.question);
      })
      .catch((error) => {
        console.error('Error fetching question:', error);
        throw error;
      });
  }
}

/**
 * Represents a filter for LeetCode questions, allowing selection by category,
 * difficulty, and premium status.
 */
class QuestionFilter {
  category: string;
  difficulty: string[];
  isFreeOnly: boolean;

  /**
   * Creates a new QuestionFilter instance.
   *
   * @param category - The category of the questions (default is "algorithms").
   * @param difficulty - The difficulty levels to filter by (default is
   * ["EASY", "MEDIUM", "HARD"]).
   * @param isFreeOnly - Whether to filter for free questions only
   * (default is true).
   */
  constructor(
    category: string = 'algorithms',
    difficulty: string[] = ['EASY', 'MEDIUM', 'HARD'],
    isFreeOnly: boolean = true,
  ) {
    this.category = category;
    this.difficulty = difficulty;
    this.isFreeOnly = isFreeOnly;
  }

  /**
   * Converts the filter to a JSON object suitable for use in GraphQL queries.
   *
   * @returns A JSON representation of the filter.
   */
  toJSON(): any {
    return {
      categorySlug: this.category,
      filtersV2: {
        difficultyFilter: {
          difficulties: this.difficulty,
          operator: 'IS',
        },
        premiumFilter: {
          premiumStatus: this.isFreeOnly ? ['NOT_PREMIUM'] : [],
          operator: 'IS',
        },
        filterCombineType: 'ALL',
      },
    };
  }
}

/**
 * Represents a bingo board containing LeetCode questions.
 *
 * @example
 * ```typescript
 * // Creating a 3x3 bingo board with default filters
 * const board = await Board.create(3);
 * ```
 */
class Board implements BingoInterfaces.Board {
  static WinConditions = {
    BINGO: 0,
    LOCKOUT: 1,
    BLACKOUT: 2,
    BINGOLOCKOUT: 3,
  };

  players: Player[];
  ready: boolean[];
  winner: number;
  size: number;
  questions: Question[];
  questionMap: Map<string, number> = new Map<string, number>();
  timestamp: [number, number][];
  filters: QuestionFilter;
  winCondition: number = Board.WinConditions.BINGO;
  startTime: Date;
  endTime: Date;
  lastActionTime: Date;
  roomId: string;
  isBoardInitialized: boolean;
  isBoardCompleted: boolean;

  static actionIntervalTime = 5000;

  constructor(
    player1: Player,
    player2: Player,
    size: number,
    filters: QuestionFilter = new QuestionFilter(),
    winCondition: number = Board.WinConditions.BINGO,
  ) {
    if (size < 1 || size > 5) {
      throw new Error('Board size must be between 1 and 5.');
    }
    if (winCondition < 0 || winCondition > 3) {
      throw new Error('Invalid win condition specified.');
    }
    if (player1.name === player2.name) {
      throw new Error('Players must have different names.');
    }
    if (filters.difficulty.length === 0) {
      throw new Error(
        'At least one difficulty must be specified in the filters.',
      );
    }
    if (filters.category !== 'algorithms') {
      throw new Error("Only the 'algorithms' category is supported for now.");
    }
    if (
      !filters.difficulty.every((d) => ['EASY', 'MEDIUM', 'HARD'].includes(d))
    ) {
      throw new Error(
        'Invalid difficulty specified in the filters. ' +
          'Valid difficulties are: EASY, MEDIUM, HARD.',
      );
    }

    this.size = size;
    this.questions = [];
    this.timestamp = [];
    this.filters = filters;
    this.winCondition = winCondition;
    this.startTime = new Date();
    this.endTime = new Date();
    this.lastActionTime = new Date();
    this.players = [player1, player2];
    this.winner = -1;
    this.isBoardInitialized = false;
    this.isBoardCompleted = false;
    this.roomId = '';
    this.ready = [false, false];
  }

  /**
   * Checks if a player has won the bingo by checking rows, columns,
   * and diagonals.
   * @returns The number of the winning player (0 or 1), or -1 if no winner,
   * or -2 if tie.
   */
  checkWin(): number {
    if (!this.isBoardInitialized) {
      console.error('Board is not initialized. Cannot check win condition.');
      return -1;
    }
    if (this.isBoardCompleted) {
      return this.winner;
    }

    const boardsize = this.size;

    switch (this.winCondition) {
      case Board.WinConditions.BINGO:
      // @ts-ignore (allow fallthrough)
      case Board.WinConditions.BINGOLOCKOUT:
        let bingoPlayerTimes = [Infinity, Infinity];
        for (let player = 0; player < 2; player++) {
          const minRowTime = Math.min(
            ...Array.from({ length: boardsize }, (_, row) => {
              return Math.max(
                ...this.timestamp
                  .slice(row * boardsize, (row + 1) * boardsize)
                  .map((timestamp) =>
                    timestamp[player] <= timestamp[1 - player]
                      ? timestamp[player]
                      : Infinity,
                  ),
              );
            }),
          );
          const minColTime = Math.min(
            ...Array.from({ length: boardsize }, (_, col) => {
              return Math.max(
                ...this.timestamp
                  .filter((_, index) => index % boardsize === col)
                  .map((timestamp) =>
                    timestamp[player] <= timestamp[1 - player]
                      ? timestamp[player]
                      : Infinity,
                  ),
              );
            }),
          );
          const minDiag1Time = Math.max(
            ...this.timestamp
              .filter((_, index) => index % (boardsize + 1) === 0)
              .map((timestamp) =>
                timestamp[player] <= timestamp[1 - player]
                  ? timestamp[player]
                  : Infinity,
              ),
          );
          const minDiag2Time = Math.max(
            ...this.timestamp
              .filter(
                (_, index) =>
                  index % (boardsize - 1) === 0 &&
                  index > 0 &&
                  index < boardsize * boardsize - 1,
              )
              .map((timestamp) =>
                timestamp[player] <= timestamp[1 - player]
                  ? timestamp[player]
                  : Infinity,
              ),
          );
          bingoPlayerTimes[player] = Math.min(
            minRowTime,
            minColTime,
            minDiag1Time,
            minDiag2Time,
          );
        }
        if (bingoPlayerTimes[0] === bingoPlayerTimes[1]) {
          const unanswered = this.timestamp.reduce((acc, timestamp) => {
            return (
              acc +
              (timestamp[0] === Infinity && timestamp[1] === Infinity ? 1 : 0)
            );
          }, 0);
          if (unanswered == 0 || bingoPlayerTimes[0] < Infinity) {
            this.winner = -2;
          }
          this.winner = -1;
        } else {
          this.winner = bingoPlayerTimes[0] < bingoPlayerTimes[1] ? 0 : 1;
        }
        if (
          this.winCondition === Board.WinConditions.BINGO ||
          this.winner != -2
        ) {
          break;
        }
      // Fallthrough if bingolockout and currently no winner
      case Board.WinConditions.LOCKOUT:
        const player1SolvedLockout = this.timestamp.reduce((acc, timestamp) => {
          return (
            acc +
            (timestamp[0] != Infinity && timestamp[0] <= timestamp[1] ? 1 : 0)
          );
        }, 0);
        const player2SolvedLockout = this.timestamp.reduce((acc, timestamp) => {
          return (
            acc +
            (timestamp[1] != Infinity && timestamp[1] <= timestamp[0] ? 1 : 0)
          );
        }, 0);
        if (
          player1SolvedLockout > (boardsize * boardsize) / 2 ||
          player2SolvedLockout > (boardsize * boardsize) / 2
        ) {
          if (player1SolvedLockout == player2SolvedLockout) {
            this.winner = -2;
          }
          this.winner = player1SolvedLockout > player2SolvedLockout ? 0 : 1;
        } else {
          this.winner = -1;
        }
        break;
      case Board.WinConditions.BLACKOUT:
        const player1SolvedBlackout = this.timestamp.reduce(
          (acc, timestamp) => {
            return acc + (timestamp[0] < Infinity ? 1 : 0);
          },
          0,
        );
        const player2SolvedBlackout = this.timestamp.reduce(
          (acc, timestamp) => {
            return acc + (timestamp[1] < Infinity ? 1 : 0);
          },
          0,
        );
        if (player1SolvedBlackout >= boardsize * boardsize) {
          this.winner = 0;
        } else if (player2SolvedBlackout > boardsize * boardsize) {
          this.winner = 1;
        } else {
          this.winner = -1;
        }
        break;
      case Board.WinConditions.BINGOLOCKOUT:
        // Lockout only checks if grid is full or if both players
        // bingo at same time
        // Bingo check
        let bingoLockoutPlayerTimes = [Infinity, Infinity];
        for (let player = 0; player < 2; player++) {
          const minRowTime = Math.min(
            ...Array.from({ length: boardsize }, (_, row) => {
              return Math.max(
                ...this.timestamp
                  .slice(row * boardsize, (row + 1) * boardsize)
                  .map((timestamp) =>
                    timestamp[player] <= timestamp[1 - player]
                      ? timestamp[player]
                      : Infinity,
                  ),
              );
            }),
          );
          const minColTime = Math.min(
            ...Array.from({ length: boardsize }, (_, col) => {
              return Math.max(
                ...this.timestamp
                  .filter((_, index) => index % boardsize === col)
                  .map((timestamp) =>
                    timestamp[player] <= timestamp[1 - player]
                      ? timestamp[player]
                      : Infinity,
                  ),
              );
            }),
          );
          const minDiag1Time = Math.max(
            ...this.timestamp
              .filter((_, index) => index % (boardsize + 1) === 0)
              .map((timestamp) =>
                timestamp[player] <= timestamp[1 - player]
                  ? timestamp[player]
                  : Infinity,
              ),
          );
          const minDiag2Time = Math.max(
            ...this.timestamp
              .filter(
                (_, index) =>
                  index % (boardsize - 1) === 0 &&
                  index > 0 &&
                  index < boardsize * boardsize - 1,
              )
              .map((timestamp) =>
                timestamp[player] <= timestamp[1 - player]
                  ? timestamp[player]
                  : Infinity,
              ),
          );
          bingoLockoutPlayerTimes[player] = Math.min(
            minRowTime,
            minColTime,
            minDiag1Time,
            minDiag2Time,
          );
        }
        if (bingoLockoutPlayerTimes[0] === bingoLockoutPlayerTimes[1]) {
          const unanswered = this.timestamp.reduce((acc, timestamp) => {
            return (
              acc +
              (timestamp[0] === Infinity && timestamp[1] === Infinity ? 1 : 0)
            );
          }, 0);
          if (unanswered == 0 || bingoLockoutPlayerTimes[0] < Infinity) {
            this.winner = -2;
          }
          this.winner = -1;
        } else {
          this.winner =
            bingoLockoutPlayerTimes[0] < bingoLockoutPlayerTimes[1] ? 0 : 1;
        }

        // Lockout check
        if (this.winner === -2) {
          const player1SolvedLockout = this.timestamp.reduce(
            (acc, timestamp) => {
              return (
                acc +
                (timestamp[0] != Infinity && timestamp[0] <= timestamp[1]
                  ? 1
                  : 0)
              );
            },
            0,
          );
          const player2SolvedLockout = this.timestamp.reduce(
            (acc, timestamp) => {
              return (
                acc +
                (timestamp[1] != Infinity && timestamp[1] <= timestamp[0]
                  ? 1
                  : 0)
              );
            },
            0,
          );
          if (
            player1SolvedLockout > (boardsize * boardsize) / 2 ||
            player2SolvedLockout > (boardsize * boardsize) / 2
          ) {
            if (player1SolvedLockout == player2SolvedLockout) {
              this.winner = -2;
            }
            this.winner = player1SolvedLockout > player2SolvedLockout ? 0 : 1;
          } else {
            this.winner = -1;
          }
        }
        break;
      default:
        this.winner = -2;
        break;
    }
    if (this.winner != -1) {
      this.isBoardCompleted = true;
      this.endTime = new Date();
    }
    return this.winner;
  }

  async initBoard() {
    if (this.isBoardInitialized) {
      return;
    }
    const questionPromises: Promise<Question>[] = [];
    for (let i = 0; i < this.size * this.size; i++) {
      questionPromises.push(
        Board.getRandomQuestion(this.filters, this.questionMap),
      );
    }
    const questions = await Promise.all(questionPromises);
    this.questions = questions;
    questions.forEach((question, index) => {
      this.questionMap.set(question.titleSlug, index);
    });
    this.timestamp = Array.from({ length: this.size * this.size }, () => [
      Infinity,
      Infinity,
    ]);
    this.isBoardInitialized = true;
    this.lastActionTime = new Date();
  }

  /**
   * Fetches a random question based on the provided filters, ensuring it
   * hasn't been seen before.
   *
   * @param filters - The filters to apply when fetching the question.
   * @param seenQuestions - A set of already seen question slugs to avoid
   * duplicates.
   * @returns A Promise that resolves to a Question object.
   */
  static getRandomQuestion(
    filters: QuestionFilter,
    seenQuestions?: Map<string, number>,
  ): Promise<Question> {
    return fetch('https://leetcode.com/graphql/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query randomQuestionV2 ($categorySlug: String, $filtersV2: QuestionFilterInput) {
            randomQuestionV2(
              categorySlug: $categorySlug
              filtersV2: $filtersV2
            ) {
              titleSlug
            }
          }
        `,
        variables: filters.toJSON(),
        operationName: 'randomQuestionV2',
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const titleSlug = data.data.randomQuestionV2.titleSlug;
        if (seenQuestions) {
          if (seenQuestions.has(titleSlug)) {
            return Board.getRandomQuestion(filters); // Retry if question has been seen
          }
          seenQuestions.set(titleSlug, -1);
        }
        return Question.fromTitleSlug(titleSlug);
      })
      .catch((error) => {
        console.error('Error fetching random question:', error);
        throw error;
      });
  }

  checkSolves(callback: Function, callbackOnWin: Function): void {
    const now = Date.now();
    if (now - this.lastActionTime.getTime() < Board.actionIntervalTime) {
      return;
    }
    this.lastActionTime = new Date();
    if (!this.isBoardInitialized) {
      console.error('Board is not initialized. Cannot check solves.');
      return;
    }
    if (this.isBoardCompleted) {
      return;
    }

    Promise.all(this.players.map((player) => player.getRecentAC()))
      .then((submissions) => {
        submissions.forEach(
          (playerSubmissions, playerIndex) => {
            playerSubmissions.forEach((submission) => {
              const questionIndex = this.questionMap.get(submission.titleSlug);
              if (
                questionIndex !== undefined &&
                submission.statusDisplay === 'Accepted'
              ) {
                const timestamp = submission.timestamp;
                if (
                  timestamp > this.startTime.getTime() / 1000 &&
                  this.timestamp[questionIndex][playerIndex] > timestamp
                ) {
                  this.timestamp[questionIndex][playerIndex] = timestamp;
                  console.log(
                    `Player ${playerIndex + 1} solved question ` +
                      `${submission.titleSlug} at ` +
                      `${new Date(timestamp * 1000).toLocaleString()}`,
                  );
                  callback(questionIndex, playerIndex, timestamp);
                }
              }
            });
          },
          (error: any) => {
            console.error(`Error fetching recent AC for players:`, error);
          },
        );
      })
      .catch((error) => {
        console.error('Error checking solves:', error);
      })
      .finally(() => {
        const winner = this.checkWin();
        if (winner !== -1) {
          console.log(`Player ${winner} wins!`);
          callbackOnWin(winner, this.endTime);
        }
      });
  }
}

class Submission {
  id: number;
  titleSlug: string;
  timestamp: number;
  statusDisplay: string;

  constructor(
    id: number,
    titleSlug: string,
    timestamp: number,
    statusDisplay: string,
  ) {
    this.id = id;
    this.titleSlug = titleSlug;
    this.timestamp = timestamp;
    this.statusDisplay = statusDisplay;
  }
}

/**
 * Represents a player in the bingo game.
 */
class Player {
  name: string;
  url: string;
  imageurl: string;

  constructor(name: string) {
    this.name = name;
    this.url = `https://leetcode.com/u/${this.name}/`;
    this.imageurl = '';
  }

  async getImageUrl(): Promise<string> {
    if (this.imageurl != '') {
      return this.imageurl;
    }
    return await fetch(`https://leetcode.com/graphql/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query userAvatar($username: String!) {
            matchedUser(username: $username){
              profile {
                userAvatar
              }
            }
          }
        `,
        variables: {
          username: this.name,
        },
        operationName: 'userAvatar',
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.data.matchedUser === null) {
          throw new Error(`User ${this.name} not found.`);
        }
        this.imageurl = data.data.matchedUser.profile.userAvatar;
        return data.data.matchedUser.profile.userAvatar;
      });
  }

  async getRecentAC(limit: number = 10): Promise<Submission[]> {
    return fetch(`https://leetcode.com/graphql/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query recentAcSubmissions($username: String!, $limit: Int!) {
            recentAcSubmissionList(username: $username, limit: $limit){
              id
              titleSlug
              timestamp
              statusDisplay
            }
          }
        `,
        variables: {
          username: this.name,
          limit: limit,
        },
        operationName: 'recentAcSubmissions',
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        return data.data.recentAcSubmissionList.map((submission: any) => {
          return new Submission(
            submission.id,
            submission.titleSlug,
            submission.timestamp,
            submission.statusDisplay,
          );
        });
      });
  }
}

export { Player, Question, QuestionFilter, Board };
