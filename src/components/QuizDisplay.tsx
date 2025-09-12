"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizData } from "@/types/quiz";
import { CheckCircle, Circle } from "lucide-react";

interface QuizDisplayProps {
  quizData: QuizData;
}

export function QuizDisplay({ quizData }: QuizDisplayProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            Generated Quiz Questions ({quizData.quiz_questions.length}{" "}
            questions)
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {quizData.quiz_questions.map((question, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Question {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                {question.question}
              </p>

              <div className="space-y-2">
                {question.answers.map((answer, answerIndex) => {
                  const letter = String.fromCharCode(65 + answerIndex); // A, B, C, D, E
                  const isCorrect = question.correct_answer === letter;

                  return (
                    <div
                      key={answerIndex}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isCorrect
                          ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                          : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            isCorrect
                              ? "text-green-700 dark:text-green-300"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {letter}.
                        </span>
                        <span
                          className={`${
                            isCorrect
                              ? "text-green-800 dark:text-green-200"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {answer.answer}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Correct Answer:</span>{" "}
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {question.correct_answer}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
