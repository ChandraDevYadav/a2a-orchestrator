"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface ManualFormProps {
  onManualGenerated?: (manual: any) => void;
}

export function ManualForm({ onManualGenerated }: ManualFormProps) {
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic for the manual",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch("/api/orchestrator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "orchestrate-manual-workflow",
          topic: topic.trim(),
          prompt: prompt.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      clearInterval(progressInterval);
      setProgress(100);

      if (result.status === "completed" && result.result?.data) {
        toast({
          title: "Success",
          description: `Manual generated successfully for topic: ${topic}`,
        });

        if (onManualGenerated) {
          onManualGenerated(result.result.data);
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Manual generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate manual. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          📚 Manual Creator
        </CardTitle>
        <CardDescription className="text-gray-600">
          Generate comprehensive manuals from any topic or prompt using AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-gray-900">
              Topic *
            </Label>
            <Input
              id="topic"
              type="text"
              placeholder="e.g., Machine Learning, React Development, Project Management"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
              required
              className="text-gray-900 bg-white border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-gray-900">
              Additional Prompt (Optional)
            </Label>
            <Textarea
              id="prompt"
              placeholder="Add specific requirements, focus areas, or additional context for the manual..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              rows={4}
              className="text-gray-900 bg-white border-gray-300"
            />
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Generating manual...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isGenerating || !topic.trim()}
          >
            {isGenerating ? "Generating Manual..." : "Generate Manual"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
