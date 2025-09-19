"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  FileText,
  Bot,
  User,
  Loader2,
  BookOpen,
  MessageSquare,
  Trash2,
  Eye,
  Copy,
  Download,
  ArrowLeft,
  Edit3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { QuizData } from "@/types/quiz";
import { useScrollbar } from "@/hooks/use-scrollbar";

interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isGenerating?: boolean;
  messageType?: "quiz" | "manual" | "chat";
  data?: any; // For quiz or manual data
}

interface GeneratedItem {
  id: string;
  type: "quiz" | "manual";
  title: string;
  timestamp: Date;
  data: any;
  preview: string;
}

interface UnifiedChatProps {
  onQuizGenerated?: (data: QuizData) => void;
  onManualGenerated?: (data: any) => void;
}

export function UnifiedChat({
  onQuizGenerated,
  onManualGenerated,
}: UnifiedChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content: "Hello! I'm your AI Assistant. How can I assist you today?",
      timestamp: new Date(),
      messageType: "chat",
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GeneratedItem | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isGeneratedResultsCollapsed, setIsGeneratedResultsCollapsed] =
    useState(false);

  // Scrollbar hooks for different panels
  const leftPanelScrollbar = useScrollbar();
  const centerPanelScrollbar = useScrollbar();
  const rightPanelScrollbar = useScrollbar();

  // Load saved items from localStorage on component mount
  useEffect(() => {
    const savedItems = localStorage.getItem("savedQuizAndManualItems");
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems);
        // Convert timestamp strings back to Date objects
        const itemsWithDates = parsedItems.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setGeneratedItems(itemsWithDates);
        console.log(
          "📁 Loaded saved items from localStorage:",
          itemsWithDates.length
        );
      } catch (error) {
        console.error("Error loading saved items:", error);
      }
    }
  }, []);

  // Save items to localStorage whenever generatedItems changes
  useEffect(() => {
    if (generatedItems.length > 0) {
      localStorage.setItem(
        "savedQuizAndManualItems",
        JSON.stringify(generatedItems)
      );
      console.log("💾 Saved items to localStorage:", generatedItems.length);
    }
  }, [generatedItems]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    console.log("Generated items state updated:", generatedItems);
  }, [generatedItems]);

  const getMessageIcon = (messageType?: string) => {
    switch (messageType) {
      case "quiz":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "manual":
        return <BookOpen className="h-4 w-4 text-green-500" />;
      case "chat":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Bot className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMessageTypeBadge = (messageType?: string) => {
    switch (messageType) {
      case "quiz":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Quiz
          </Badge>
        );
      case "manual":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Manual
          </Badge>
        );
      case "chat":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Chat
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      // Send request to orchestrator for centralized decision making
      const response = await fetch("/api/orchestrator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "handle_centralized_request",
          query: input.trim(),
          context: {
            chatMode: "unified",
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Unified response:", result);
      console.log("Generated items before processing:", generatedItems);

      let assistantContent = "";
      let messageType: "quiz" | "manual" | "chat" = "chat";
      let data: any = null;

      if (result.type === "quiz") {
        messageType = "quiz";
        const quizData = result.result?.data || result.result || result.data;
        console.log("Quiz data extracted:", quizData);
        console.log("Full result object:", result);
        console.log("Result type:", result.type);
        console.log("Result result:", result.result);

        if (quizData && quizData.quiz_questions) {
          console.log("✅ Quiz data is valid, proceeding with generation");
          assistantContent = `I've generated a comprehensive quiz with ${quizData.quiz_questions.length} questions! Here's what I created:\n\n`;

          // Show first few questions as preview
          const previewQuestions = quizData.quiz_questions.slice(0, 3);
          previewQuestions.forEach((question: any, index: number) => {
            assistantContent += `**Question ${index + 1}:** ${
              question.question
            }\n`;
            assistantContent += `**Correct Answer:** ${question.correct_answer}\n\n`;
          });

          if (quizData.quiz_questions.length > 3) {
            assistantContent += `...and ${
              quizData.quiz_questions.length - 3
            } more questions!\n\n`;
          }

          assistantContent +=
            "The quiz is now ready! You can view all questions or ask me to modify any specific questions.";
          data = quizData;

          // Add to generated items
          const newItem: GeneratedItem = {
            id: Date.now().toString(),
            type: "quiz",
            title: `Quiz: ${
              quizData.quiz_questions[0]?.question?.substring(0, 50) ||
              "Generated Quiz"
            }`,
            timestamp: new Date(),
            data: quizData,
            preview: `Generated quiz with ${quizData.quiz_questions.length} questions`,
          };
          console.log("Adding quiz item:", newItem);
          setGeneratedItems((prev) => {
            const updated = [newItem, ...prev];
            console.log("Updated generated items:", updated);
            return updated;
          });
          setSelectedItem(newItem);

          // Call the quiz generated callback
          if (onQuizGenerated) {
            onQuizGenerated(quizData);
          }
        } else {
          console.log("❌ Quiz data is invalid or missing quiz_questions");
          console.log("Quiz data:", quizData);
          assistantContent =
            "I apologize, but I encountered an issue generating the quiz. Please try again with a different topic.";
        }
      } else if (result.type === "manual") {
        messageType = "manual";
        const manualData = result.result?.data || result.result || result.data;
        console.log("Manual data extracted:", manualData);
        console.log("Full result object:", result);
        console.log("Result type:", result.type);
        console.log("Result result:", result.result);

        if (manualData) {
          console.log("✅ Manual data is valid, proceeding with generation");
          assistantContent = `I've generated a comprehensive manual! Here's what I created:\n\n`;

          if (manualData.title) {
            assistantContent += `**Title:** ${manualData.title}\n\n`;
          }

          if (manualData.introduction?.purpose) {
            assistantContent += `**Purpose:** ${manualData.introduction.purpose}\n\n`;
          }

          if (manualData.sections && manualData.sections.length > 0) {
            assistantContent += `**Sections:** ${manualData.sections.length} sections covering:\n`;
            manualData.sections.forEach((section: any, index: number) => {
              assistantContent += `- ${
                section.title || `Section ${index + 1}`
              }\n`;
            });
            assistantContent += "\n";
          }

          assistantContent +=
            "The manual is now ready! You can view the full content or ask me to modify any specific section.";
          data = manualData;

          // Add to generated items
          const newItem: GeneratedItem = {
            id: Date.now().toString(),
            type: "manual",
            title: manualData.title || "Generated Manual",
            timestamp: new Date(),
            data: manualData,
            preview: `${manualData.sections?.length || 0} sections`,
          };
          console.log("Adding manual item:", newItem);
          setGeneratedItems((prev) => {
            const updated = [newItem, ...prev];
            console.log("Updated generated items:", updated);
            return updated;
          });
          setSelectedItem(newItem);

          // Call the manual generated callback
          if (onManualGenerated) {
            onManualGenerated(manualData);
          }
        } else {
          console.log("❌ Manual data is invalid or missing");
          console.log("Manual data:", manualData);
          assistantContent =
            "I apologize, but I encountered an issue generating the manual. Please try again with a different topic.";
        }
      } else if (result.type === "chat") {
        messageType = "chat";
        assistantContent =
          result.response ||
          result.content ||
          "I'm here to help! How can I assist you today?";
      } else if (result.type === "error") {
        assistantContent =
          result.response ||
          "I apologize, but I encountered an issue. Please try again.";
      } else {
        // Fallback for general chat
        messageType = "chat";
        assistantContent =
          result.response ||
          result.content ||
          "I'm here to help! How can I assist you today?";
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: assistantContent,
        timestamp: new Date(),
        messageType,
        data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Unified chat failed:", error);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "I apologize, but I encountered an issue. Please try again or rephrase your request.",
        timestamp: new Date(),
        messageType: "chat",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: "1",
        type: "assistant",
        content: "Hello! I'm your AI Assistant. How can I assist you today?",
        timestamp: new Date(),
        messageType: "chat",
      },
    ]);
    setGeneratedItems([]);
    setSelectedItem(null);
  };

  const clearSavedItems = () => {
    setGeneratedItems([]);
    localStorage.removeItem("savedQuizAndManualItems");
    console.log("🗑️ Cleared all saved items");
  };

  const deleteSavedItem = (itemId: string) => {
    const updatedItems = generatedItems.filter((item) => item.id !== itemId);
    setGeneratedItems(updatedItems);
    console.log("🗑️ Deleted item:", itemId);
  };

  const startEditingTitle = (item: GeneratedItem) => {
    setEditingItemId(item.id);
    setEditingTitle(item.title);
  };

  const saveEditedTitle = () => {
    if (editingItemId && editingTitle.trim()) {
      const updatedItems = generatedItems.map((item) =>
        item.id === editingItemId
          ? { ...item, title: editingTitle.trim() }
          : item
      );
      setGeneratedItems(updatedItems);

      // Update selected item if it's the one being edited
      if (selectedItem?.id === editingItemId) {
        setSelectedItem({ ...selectedItem, title: editingTitle.trim() });
      }

      setEditingItemId(null);
      setEditingTitle("");
      console.log("✏️ Updated title for item:", editingItemId);
    }
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setEditingTitle("");
  };

  const toggleGeneratedResultsCollapse = () => {
    setIsGeneratedResultsCollapsed(!isGeneratedResultsCollapsed);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getItemIcon = (type: "quiz" | "manual") => {
    return type === "quiz" ? (
      <FileText className="h-4 w-4 text-blue-500" />
    ) : (
      <BookOpen className="h-4 w-4 text-green-500" />
    );
  };

  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
      console.log("Content copied to clipboard");
    } catch (err) {
      console.error("Failed to copy content:", err);
    }
  };

  const handleDownloadContent = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatQuizContent = (quizData: any) => {
    let content = `${quizData.title || "Generated Quiz"}\n\n`;

    if (quizData.introduction) {
      content += `Introduction:\n${quizData.introduction}\n\n`;
    }

    content += `Questions (${quizData.quiz_questions?.length || 0} total):\n\n`;

    quizData.quiz_questions?.forEach((question: any, index: number) => {
      content += `Question ${index + 1}: ${question.question}\n`;
      question.answers?.forEach((answer: any, i: number) => {
        const letter = String.fromCharCode(65 + i); // A, B, C, D
        content += `${letter}. ${answer.answer}\n`;
      });
      content += `Correct Answer: ${question.correct_answer}\n`;
      if (question.difficulty) {
        content += `Difficulty: ${question.difficulty}\n`;
      }
      content += "\n";
    });

    return content;
  };

  const formatManualContent = (manualData: any) => {
    let content = `${manualData.title || "Generated Manual"}\n\n`;

    if (manualData.introduction) {
      if (manualData.introduction.purpose) {
        content += `Purpose: ${manualData.introduction.purpose}\n\n`;
      }
      if (manualData.introduction.audience) {
        content += `Audience: ${manualData.introduction.audience}\n\n`;
      }
      if (manualData.introduction.prerequisites) {
        content += `Prerequisites: ${manualData.introduction.prerequisites}\n\n`;
      }
    }

    if (manualData.sections) {
      content += "Sections:\n\n";
      manualData.sections.forEach((section: any, index: number) => {
        content += `${index + 1}. ${section.title || `Section ${index + 1}`}\n`;
        if (section.content) {
          content += `   ${section.content}\n`;
        }
        if (section.subsections) {
          section.subsections.forEach((subsection: any, subIndex: number) => {
            content += `   ${index + 1}.${subIndex + 1}. ${
              subsection.title || `Subsection ${subIndex + 1}`
            }\n`;
            if (subsection.content) {
              content += `      ${subsection.content}\n`;
            }
          });
        }
        content += "\n";
      });
    }

    if (manualData.conclusion) {
      content += `Conclusion:\n${manualData.conclusion}\n\n`;
    }

    if (manualData.appendix) {
      content += "Appendix:\n";
      if (manualData.appendix.glossary) {
        content += `Glossary: ${manualData.appendix.glossary}\n`;
      }
      if (manualData.appendix.resources) {
        content += `Resources: ${manualData.appendix.resources}\n`;
      }
    }

    return content;
  };

  return (
    <div className="w-full h-[650px] flex gap-4 rounded-lg overflow-hidden">
      {/* Left Panel - Saved Quiz & Manual Items */}
      <div className="w-1/4 border-r bg-gray-50/90 flex flex-col rounded-[16px]">
        <div className="p-5 border-b bg-gray-50 rounded-t-[16px]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900">
              Saved Items{" "}
              {generatedItems.length > 0 && `(${generatedItems.length})`}
            </h3>
          </div>
        </div>
        <div
          className={`flex-1 overflow-y-auto ${leftPanelScrollbar.scrollbarClasses}`}
          onScroll={leftPanelScrollbar.handleScroll}
        >
          <div className="p-2">
            {generatedItems.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No saved items</p>
                <p className="text-xs">Generate quiz or manual to save</p>
              </div>
            ) : (
              <div className="space-y-2">
                {generatedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2 rounded text-xs cursor-pointer transition-colors group ${
                      selectedItem?.id === item.id
                        ? "bg-blue-200 border border-blue-300"
                        : "bg-white border border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {getItemIcon(item.type)}
                      {editingItemId === item.id ? (
                        <div className="flex-1 flex items-center gap-1">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveEditedTitle();
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                cancelEditing();
                              }
                            }}
                            className="flex-1 text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              saveEditedTitle();
                            }}
                            className="h-4 w-4 p-0"
                            title="Save changes"
                          >
                            <span className="text-green-600 text-xs">✓</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditing();
                            }}
                            className="h-4 w-4 p-0"
                            title="Cancel editing"
                          >
                            <span className="text-gray-500 text-xs">✕</span>
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium flex-1 truncate text-gray-900">
                            {item.title}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingTitle(item);
                              }}
                              className="h-4 w-4 p-0"
                              title="Edit title"
                            >
                              <Edit3 className="h-3 w-3 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSavedItem(item.id);
                                if (selectedItem?.id === item.id) {
                                  setSelectedItem(null);
                                }
                              }}
                              className="h-4 w-4 p-0"
                              title="Delete this item"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-gray-600 truncate mb-1">
                      {item.preview}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={`text-xs px-1 py-0 ${
                          item.type === "quiz"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {item.type}
                      </Badge>
                      <span className="text-gray-400 text-xs">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Panel - Generated Results */}
      {!isGeneratedResultsCollapsed && (
        <div className="w-2/4 border-r bg-gray-50/90 flex flex-col rounded-[16px] transition-all duration-300 ease-in-out">
          <div className="p-4 border-b bg-gray-50 rounded-t-[16px]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-900">
                Generated Results
              </h3>
              {selectedItem && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const content =
                        selectedItem.type === "quiz"
                          ? formatQuizContent(selectedItem.data)
                          : formatManualContent(selectedItem.data);
                      const filename =
                        selectedItem.type === "quiz"
                          ? "quiz.txt"
                          : "manual.txt";
                      handleCopyContent(content);
                    }}
                    className="h-7 px-2 text-xs text-gray-900 hover:bg-blue-600 hover:text-white"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const content =
                        selectedItem.type === "quiz"
                          ? formatQuizContent(selectedItem.data)
                          : formatManualContent(selectedItem.data);
                      const filename =
                        selectedItem.type === "quiz"
                          ? "quiz.txt"
                          : "manual.txt";
                      handleDownloadContent(content, filename);
                    }}
                    className="h-7 px-2 text-xs text-gray-900 hover:bg-red-600 hover:text-white"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </div>

          {selectedItem ? (
            <div
              className={`flex-1 overflow-y-auto ${centerPanelScrollbar.scrollbarClasses}`}
              onScroll={centerPanelScrollbar.handleScroll}
            >
              <div className="p-4">
                {/* Content Header */}
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    {/* {getItemIcon(selectedItem.type)}
                  <h2 className="text-lg font-semibold text-gray-900 text-uppercase">
                    {selectedItem.type}
                  </h2> */}
                    {/* <Badge
                    variant="secondary"
                    className={`text-lg text-capitalize ${
                      selectedItem.type === "quiz"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {selectedItem.type}
                  </Badge> */}
                  </div>
                  <p className="text-[16px] text-gray-800 font-medium">
                    {selectedItem.preview}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Generated: {formatTimestamp(selectedItem.timestamp)}
                  </p>
                </div>

                {/* Content Display */}
                <div className="bg-white/90 text-gray-900 rounded-[12px] p-4">
                  {selectedItem.type === "quiz" ? (
                    <div className="space-y-4">
                      {/* <h3 className="font-semibold text-lg">
                      {selectedItem.data.title || "Generated Quiz"}
                    </h3> */}

                      {selectedItem.data.introduction && (
                        <div>
                          <h4 className="font-medium mb-2">Introduction:</h4>
                          <p className="text-sm text-gray-700">
                            {selectedItem.data.introduction}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium mb-3">
                          Questions (
                          {selectedItem.data.quiz_questions?.length || 0}{" "}
                          total):
                        </h4>
                        <div className="space-y-4">
                          {selectedItem.data.quiz_questions?.map(
                            (question: any, index: number) => (
                              <div
                                key={index}
                                className="bg-white p-3 rounded border"
                              >
                                <p className="font-medium mb-2">
                                  Question {index + 1}: {question.question}
                                </p>
                                <div className="space-y-1 mb-2">
                                  {question.answers?.map(
                                    (answer: any, i: number) => {
                                      const letter = String.fromCharCode(
                                        65 + i
                                      ); // A, B, C, D
                                      const isCorrect =
                                        letter === question.correct_answer;
                                      return (
                                        <div
                                          key={i}
                                          className={`p-2 rounded text-sm ${
                                            isCorrect
                                              ? "bg-green-100 border border-green-300"
                                              : "bg-gray-50"
                                          }`}
                                        >
                                          <span className="font-medium">
                                            {letter}.
                                          </span>{" "}
                                          {answer.answer}
                                          {isCorrect && (
                                            <span className="ml-2 text-green-600 font-medium">
                                              ✓ Correct
                                            </span>
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                                {question.difficulty && (
                                  <p className="text-xs text-gray-500">
                                    Difficulty: {question.difficulty}
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* <h3 className="font-semibold text-lg">
                      {selectedItem.data.title || "Generated Manual"}
                    </h3> */}

                      {selectedItem.data.introduction && (
                        <div>
                          <h4 className="font-medium mb-2">Introduction:</h4>
                          {selectedItem.data.introduction.purpose && (
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Purpose:</strong>{" "}
                              {typeof selectedItem.data.introduction.purpose ===
                              "string"
                                ? selectedItem.data.introduction.purpose
                                : JSON.stringify(
                                    selectedItem.data.introduction.purpose
                                  )}
                            </p>
                          )}
                          {selectedItem.data.introduction.audience && (
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Audience:</strong>{" "}
                              {typeof selectedItem.data.introduction
                                .audience === "string"
                                ? selectedItem.data.introduction.audience
                                : JSON.stringify(
                                    selectedItem.data.introduction.audience
                                  )}
                            </p>
                          )}
                          {selectedItem.data.introduction.prerequisites && (
                            <p className="text-sm text-gray-700">
                              <strong>Prerequisites:</strong>{" "}
                              {typeof selectedItem.data.introduction
                                .prerequisites === "string"
                                ? selectedItem.data.introduction.prerequisites
                                : JSON.stringify(
                                    selectedItem.data.introduction.prerequisites
                                  )}
                            </p>
                          )}
                        </div>
                      )}

                      {selectedItem.data.sections && (
                        <div>
                          <h4 className="font-medium mb-3">Sections:</h4>
                          <div className="space-y-3">
                            {selectedItem.data.sections.map(
                              (section: any, index: number) => (
                                <div
                                  key={index}
                                  className="bg-white p-3 rounded border"
                                >
                                  <h5 className="font-medium mb-2">
                                    {index + 1}.{" "}
                                    {section.title || `Section ${index + 1}`}
                                  </h5>
                                  {section.content && (
                                    <p className="text-sm text-gray-700 mb-2">
                                      {typeof section.content === "string"
                                        ? section.content
                                        : JSON.stringify(section.content)}
                                    </p>
                                  )}
                                  {section.subsections &&
                                    section.subsections.length > 0 && (
                                      <div className="ml-4 space-y-2">
                                        {section.subsections.map(
                                          (
                                            subsection: any,
                                            subIndex: number
                                          ) => (
                                            <div key={subIndex}>
                                              <h6 className="font-medium text-sm">
                                                {index + 1}.{subIndex + 1}.{" "}
                                                {subsection.title ||
                                                  `Subsection ${subIndex + 1}`}
                                              </h6>
                                              {subsection.content && (
                                                <p className="text-xs text-gray-600 ml-2">
                                                  {typeof subsection.content ===
                                                  "string"
                                                    ? subsection.content
                                                    : JSON.stringify(
                                                        subsection.content
                                                      )}
                                                </p>
                                              )}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {selectedItem.data.conclusion && (
                        <div>
                          <h4 className="font-medium mb-2">Conclusion:</h4>
                          <p className="text-sm text-gray-700">
                            {typeof selectedItem.data.conclusion === "string"
                              ? selectedItem.data.conclusion
                              : JSON.stringify(selectedItem.data.conclusion)}
                          </p>
                        </div>
                      )}

                      {selectedItem.data.appendix && (
                        <div>
                          <h4 className="font-medium mb-2">Appendix:</h4>
                          {selectedItem.data.appendix.glossary && (
                            <p className="text-sm text-gray-700 mb-1">
                              <strong>Glossary:</strong>{" "}
                              {typeof selectedItem.data.appendix.glossary ===
                              "string"
                                ? selectedItem.data.appendix.glossary
                                : JSON.stringify(
                                    selectedItem.data.appendix.glossary
                                  )}
                            </p>
                          )}
                          {selectedItem.data.appendix.resources && (
                            <p className="text-sm text-gray-700">
                              <strong>Resources:</strong>{" "}
                              {typeof selectedItem.data.appendix.resources ===
                              "string"
                                ? selectedItem.data.appendix.resources
                                : JSON.stringify(
                                    selectedItem.data.appendix.resources
                                  )}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`flex-1 overflow-y-auto ${centerPanelScrollbar.scrollbarClasses}`}
              onScroll={centerPanelScrollbar.handleScroll}
            >
              <div className="p-4">
                {generatedItems.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No generated content yet</p>
                    <p className="text-sm">
                      Start a conversation to see results here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      {/* <ArrowLeft className="h-4 w-4 text-gray-500" /> */}
                      <span className="text-sm text-gray-600">
                        Click on an item below to view details
                      </span>
                    </div>
                    {generatedItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          (selectedItem as GeneratedItem | null)?.id === item.id
                            ? "border-blue-500 bg-blue-300"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {getItemIcon(item.type)}
                          <span className="font-medium text-sm text-gray-900">
                            {item.title}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              item.type === "quiz"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {item.preview}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatTimestamp(item.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Right Panel - Main Chat */}
      <div
        className={`${
          isGeneratedResultsCollapsed ? "w-3/4" : "w-1/4"
        } bg-gray-50/90 flex flex-col rounded-[16px] transition-all duration-300 ease-in-out`}
      >
        <div className="p-[18px] border-b bg-gray-50 rounded-t-[16px]">
          <div className="flex items-center justify-between text-gray-900">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <h3 className="font-semibold text-sm text-gray-900">
                AI Assistant
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleGeneratedResultsCollapse}
              className="h-6 w-6 p-0 hover:bg-gray-200"
              title={
                isGeneratedResultsCollapsed
                  ? "Show Generated Results"
                  : "Hide Generated Results"
              }
            >
              {isGeneratedResultsCollapsed ? (
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              )}
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          className={`flex-1 overflow-y-auto ${rightPanelScrollbar.scrollbarClasses}`}
          onScroll={rightPanelScrollbar.handleScroll}
        >
          <div className="p-4 space-y-3">
            {messages.slice(-10).map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.type === "user" ? (
                  <div className="max-w-[80%]">
                    <div className="flex justify-end gap-1 mb-1">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="bg-blue-500 text-white p-2 rounded-[8px] shadow-sm text-xs">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[80%]">
                    <div className="flex items-center gap-1 mb-1">
                      {getMessageIcon(message.messageType)}
                      <span className="text-xs font-medium text-gray-900">
                        AI
                      </span>
                    </div>
                    <div className="bg-gray-50 text-gray-900 p-2 rounded-[8px] shadow-sm text-xs whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex gap-2 justify-start">
                <div className="bg-gray-100 p-2 rounded-lg text-xs">
                  <div className="flex items-center gap-1 text-gray-900">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="min-h-[60px] resize-none text-sm text-gray-900 rounded-[12px]"
                disabled={isGenerating}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isGenerating}
                size="sm"
                className="flex-1 text-blue-600"
              >
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Quick Actions */}
            {/* <div className="grid grid-cols-3 gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("Create a quiz about science")}
                disabled={isGenerating}
                className="text-xs text-gray-900"
              >
                <FileText className="h-3 w-3 mr-1" />
                Quiz
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("Create a manual about React")}
                disabled={isGenerating}
                className="text-xs text-gray-900"
              >
                <BookOpen className="h-3 w-3 mr-1" />
                Manual
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("Hello!")}
                disabled={isGenerating}
                className="text-xs text-gray-900"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Chat
              </Button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
