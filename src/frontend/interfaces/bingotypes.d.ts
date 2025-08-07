interface Board {
  players: Player[];
  ready: boolean[];
  winner: number;
  size: number;
  questions: Question[];
  questionMap: Map<string, number>;
  timestamp: [number, number][];
  filters: { [key: string]: any };
  winCondition: number;
  startTime: Date;
  endTime: Date;
  roomId: string;
  isBoardInitialized: boolean;
  isBoardCompleted: boolean;
}

interface Question {
  questionId: number;
  title: string;
  titleSlug: string;
  url: string;
}
interface Player {
  name: string;
  url: string;
  imageurl: string;
}

export type { Board, Question, Player };
