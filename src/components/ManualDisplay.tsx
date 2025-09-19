"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ManualData {
  title?: string;
  introduction?: {
    purpose?: string;
    objectives?: string[];
  };
  sections?: Array<{
    title?: string;
    content?: string;
    keyPoints?: string[];
  }>;
  conclusion?: {
    summary?: string;
    nextSteps?: string[];
  };
  glossary?: Record<string, string>;
}

interface ManualDisplayProps {
  manual: ManualData;
  onClose?: () => void;
}

export function ManualDisplay({ manual, onClose }: ManualDisplayProps) {
  const handleDownload = () => {
    const content = generateManualText(manual);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${manual.title || "manual"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateManualText = (manual: ManualData): string => {
    let text = "";

    if (manual.title) {
      text += `${manual.title}\n`;
      text += "=".repeat(manual.title.length) + "\n\n";
    }

    if (manual.introduction) {
      text += "INTRODUCTION\n";
      text += "-".repeat(11) + "\n\n";

      if (manual.introduction.purpose) {
        text += `Purpose: ${manual.introduction.purpose}\n\n`;
      }

      if (
        manual.introduction.objectives &&
        manual.introduction.objectives.length > 0
      ) {
        text += "Learning Objectives:\n";
        manual.introduction.objectives.forEach((objective, index) => {
          text += `${index + 1}. ${objective}\n`;
        });
        text += "\n";
      }
    }

    if (manual.sections && manual.sections.length > 0) {
      manual.sections.forEach((section, index) => {
        text += `${index + 1}. ${section.title || `Section ${index + 1}`}\n`;
        text +=
          "-".repeat((section.title || `Section ${index + 1}`).length + 4) +
          "\n\n";

        if (section.content) {
          text += `${section.content}\n\n`;
        }

        if (section.keyPoints && section.keyPoints.length > 0) {
          text += "Key Points:\n";
          section.keyPoints.forEach((point, pointIndex) => {
            text += `  • ${point}\n`;
          });
          text += "\n";
        }
      });
    }

    if (manual.conclusion) {
      text += "CONCLUSION\n";
      text += "-".repeat(9) + "\n\n";

      if (manual.conclusion.summary) {
        text += `Summary: ${manual.conclusion.summary}\n\n`;
      }

      if (
        manual.conclusion.nextSteps &&
        manual.conclusion.nextSteps.length > 0
      ) {
        text += "Next Steps:\n";
        manual.conclusion.nextSteps.forEach((step, index) => {
          text += `${index + 1}. ${step}\n`;
        });
        text += "\n";
      }
    }

    if (manual.glossary && Object.keys(manual.glossary).length > 0) {
      text += "GLOSSARY\n";
      text += "-".repeat(8) + "\n\n";

      Object.entries(manual.glossary).forEach(([term, definition]) => {
        text += `${term}: ${definition}\n`;
      });
    }

    return text;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Generated Manual</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="text-gray-900 hover:bg-blue-600 hover:text-white rounded-[16px]"
          >
            📥 Download
          </Button>
          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              className="text-gray-900 hover:bg-red-600 hover:text-white"
            >
              ✕ Close
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">
            {manual.title || "Generated Manual"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {manual.introduction && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                Introduction
              </h3>
              {manual.introduction.purpose && (
                <p className="mb-3 text-gray-700">
                  {manual.introduction.purpose}
                </p>
              )}
              {manual.introduction.objectives &&
                manual.introduction.objectives.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900">
                      Learning Objectives:
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {manual.introduction.objectives.map(
                        (objective, index) => (
                          <li key={index} className="text-sm text-gray-700">
                            {objective}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {manual.sections && manual.sections.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                Sections
              </h3>
              <div className="space-y-4">
                {manual.sections.map((section, index) => (
                  <div key={index} className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium mb-2 text-gray-900">
                      {index + 1}. {section.title || `Section ${index + 1}`}
                    </h4>
                    {section.content && (
                      <p className="text-sm text-gray-700 mb-2">
                        {section.content}
                      </p>
                    )}
                    {section.keyPoints && section.keyPoints.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-1 text-gray-900">
                          Key Points:
                        </h5>
                        <ul className="list-disc list-inside space-y-1">
                          {section.keyPoints.map((point, pointIndex) => (
                            <li
                              key={pointIndex}
                              className="text-xs text-gray-600"
                            >
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {manual.conclusion && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                Conclusion
              </h3>
              {manual.conclusion.summary && (
                <p className="mb-3 text-gray-700">
                  {manual.conclusion.summary}
                </p>
              )}
              {manual.conclusion.nextSteps &&
                manual.conclusion.nextSteps.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-gray-900">
                      Next Steps:
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {manual.conclusion.nextSteps.map((step, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {manual.glossary && Object.keys(manual.glossary).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                Glossary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(manual.glossary).map(([term, definition]) => (
                  <div key={term} className="flex flex-col">
                    <Badge variant="secondary" className="w-fit mb-1">
                      {term}
                    </Badge>
                    <span className="text-sm text-gray-700">{definition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
