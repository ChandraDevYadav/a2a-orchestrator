"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuizSession, QuizResult } from "@/types/quiz";
import { CheckCircle, XCircle, RotateCcw, Trophy, Clock } from "lucide-react";

interface QuizTakerProps {
  session: QuizSession;
  onComplete: (session: QuizSession) => void;
  onReset: () => void;
}

export function QuizTaker({ session, onComplete, onReset }: QuizTakerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = session.questions[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + 1) / session.questions.length) * 100;

  const handleCompleteQuiz = useCallback(() => {
    if (isCompleted) return;

    // Complete remaining questions as unanswered
    const remainingResults: QuizResult[] = [];
    for (let i = currentQuestionIndex; i < session.questions.length; i++) {
      remainingResults.push({
        questionIndex: i,
        selectedAnswer: "",
        isCorrect: false,
      });
    }

    const allResults = [...session.results, ...remainingResults];
    const score = allResults.filter((r) => r.isCorrect).length;
    const completedSession = {
      ...session,
      results: allResults,
      score,
      completedAt: new Date(),
    };

    setIsCompleted(true);
    setShowResults(true);
    onComplete(completedSession);
  }, [isCompleted, currentQuestionIndex, session, onComplete]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleCompleteQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleCompleteQuiz]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (!selectedAnswer) return;

    // Extract the letter from the correct answer (e.g., "A. Something" -> "A")
    const correctAnswerLetter = currentQuestion.correct_answer.charAt(0);
    const isCorrect = selectedAnswer === correctAnswerLetter;
    const result: QuizResult = {
      questionIndex: currentQuestionIndex,
      selectedAnswer,
      isCorrect,
    };

    const updatedResults = [...session.results, result];
    const updatedSession = {
      ...session,
      results: updatedResults,
    };

    if (currentQuestionIndex === session.questions.length - 1) {
      // Last question
      const score = updatedResults.filter((r) => r.isCorrect).length;
      const completedSession = {
        ...updatedSession,
        score,
        completedAt: new Date(),
      };
      setIsCompleted(true);
      setShowResults(true);
      onComplete(completedSession);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer("");
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (showResults) {
    const correctAnswers = session.results.filter((r) => r.isCorrect).length;
    const percentage = Math.round(
      (correctAnswers / session.questions.length) * 100
    );
    const isPassing = percentage >= 70;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy
              className={`h-16 w-16 ${
                isPassing ? "text-yellow-500" : "text-gray-400"
              }`}
            />
          </div>
          <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {correctAnswers}/{session.questions.length}
            </div>
            <div
              className={`text-2xl font-semibold ${
                isPassing
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {percentage}%
            </div>
            <div
              className={`text-lg font-medium ${
                isPassing
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {isPassing
                ? "Congratulations! You passed!"
                : "Better luck next time!"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {correctAnswers}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Correct Answers
              </div>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {session.questions.length - correctAnswers}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">
                Incorrect Answers
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={onReset} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Create New Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress and Timer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                Question {currentQuestionIndex + 1} of{" "}
                {session.questions.length}
              </h3>
              <Progress value={progress} className="mt-2" />
            </div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {currentQuestion.answers.map((answer, index) => {
              const letter = String.fromCharCode(65 + index);
              const isSelected = selectedAnswer === letter;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(letter)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {isSelected && <CheckCircle className="h-4 w-4" />}
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {letter}.
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {answer.answer}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between pt-4">
            <Button
              onClick={handleCompleteQuiz}
              variant="outline"
              disabled={isCompleted}
            >
              Complete Quiz
            </Button>
            <Button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer || isCompleted}
            >
              {currentQuestionIndex === session.questions.length - 1
                ? "Finish"
                : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
