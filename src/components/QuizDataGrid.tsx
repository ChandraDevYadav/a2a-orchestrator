"use client";

import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { QuizData } from "@/types/quiz";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface QuizDataGridProps {
  quizData: QuizData;
}

interface QuizQuestionRow {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: string;
  difficulty: string;
}

export function QuizDataGrid({ quizData }: QuizDataGridProps) {
  const rowData = useMemo(() => {
    return quizData.quiz_questions.map((question, index) => ({
      id: index + 1,
      question: question.question,
      optionA: question.answers[0]?.answer || "",
      optionB: question.answers[1]?.answer || "",
      optionC: question.answers[2]?.answer || "",
      optionD: question.answers[3]?.answer || "",
      optionE: question.answers[4]?.answer || "",
      correctAnswer: question.correct_answer,
      difficulty: question.difficulty || "Medium",
    }));
  }, [quizData]);

  const columnDefs: ColDef<QuizQuestionRow>[] = [
    {
      headerName: "#",
      field: "id",
      width: 60,
      pinned: "left",
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "Question",
      field: "question",
      width: 300,
      wrapText: true,
      autoHeight: true,
      cellStyle: {
        display: "flex",
        alignItems: "center",
        padding: "8px",
      },
    },
    {
      headerName: "Option A",
      field: "optionA",
      width: 150,
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: "Option B",
      field: "optionB",
      width: 150,
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: "Option C",
      field: "optionC",
      width: 150,
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: "Option D",
      field: "optionD",
      width: 150,
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: "Option E",
      field: "optionE",
      width: 150,
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: "Correct",
      field: "correctAnswer",
      width: 80,
      pinned: "right",
      cellStyle: (params) => ({
        backgroundColor: "#dcfce7",
        color: "#166534",
        fontWeight: "bold",
        textAlign: "center",
      }),
    },
    {
      headerName: "Difficulty",
      field: "difficulty",
      width: 100,
      pinned: "right",
      cellStyle: (params) => {
        const difficulty = params.value?.toLowerCase();
        const colors = {
          easy: { bg: "#dcfce7", color: "#166534" },
          medium: { bg: "#fef3c7", color: "#92400e" },
          hard: { bg: "#fee2e2", color: "#991b1b" },
        };
        const style =
          colors[difficulty as keyof typeof colors] || colors.medium;
        return {
          backgroundColor: style.bg,
          color: style.color,
          fontWeight: "bold",
          textAlign: "center",
        };
      },
    },
  ];

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  return (
    <div className="w-full h-[600px]">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Quiz Questions Overview ({rowData.length} questions)
        </h3>
        <div className="text-sm text-gray-600">
          Scroll horizontally to see all options
        </div>
      </div>
      <div className="ag-theme-alpine w-full h-full">
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[5, 10, 20, 50]}
          enableRangeSelection={true}
          enableCharts={true}
        />
      </div>
    </div>
  );
}
