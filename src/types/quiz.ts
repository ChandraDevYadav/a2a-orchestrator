export interface QuizAnswer {
  answer: string;
}

export interface QuizQuestion {
  question: string;
  correct_answer: string;
  answers: QuizAnswer[];
  difficulty?: string; // Optional difficulty level (Easy, Medium, Hard)
}

export interface QuizData {
  quiz_questions: QuizQuestion[];
}

export interface QuizGenerationRequest {
  input: string;
}

export interface QuizGenerationResponse {
  data: QuizData;
}

export interface QuizResult {
  questionIndex: number;
  selectedAnswer: string;
  isCorrect: boolean;
}

export interface QuizSession {
  id: string;
  questions: QuizQuestion[];
  results: QuizResult[];
  score: number;
  completedAt?: Date;
}
