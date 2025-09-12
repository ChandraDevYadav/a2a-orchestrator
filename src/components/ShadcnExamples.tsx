"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Save,
  Trash2,
  Edit,
  Eye,
  Download,
  Share2,
  Star,
  Clock,
  Users,
} from "lucide-react";

// Example component showing various shadcn/ui patterns
export function ShadcnExamples() {
  const [isEditing, setIsEditing] = useState(false);
  const [quizTitle, setQuizTitle] = useState("Sample Quiz");
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Quiz Saved",
      description: "Your quiz has been saved successfully.",
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    toast({
      title: "Quiz Deleted",
      description: "The quiz has been permanently deleted.",
      variant: "destructive",
    });
  };

  const handleShare = () => {
    toast({
      title: "Quiz Shared",
      description: "Quiz link copied to clipboard.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        shadcn/ui Component Examples
      </h1>

      {/* Card with Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Quiz Management</CardTitle>
              <CardDescription>
                Manage your quiz settings and options
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Quiz Title</label>
                <Input
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Enter quiz title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Enter quiz description"
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-medium">{quizTitle}</p>
              <p className="text-sm text-muted-foreground">
                A comprehensive quiz covering various topics with 20 questions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-20 flex-col">
          <Eye className="h-6 w-6 mb-2" />
          Preview
        </Button>
        <Button variant="outline" className="h-20 flex-col">
          <Download className="h-6 w-6 mb-2" />
          Export
        </Button>
        <Button variant="outline" className="h-20 flex-col">
          <Users className="h-6 w-6 mb-2" />
          Assign
        </Button>
        <Button variant="outline" className="h-20 flex-col">
          <Star className="h-6 w-6 mb-2" />
          Favorite
        </Button>
      </div>

      {/* Dialog Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Settings Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Quiz Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quiz Settings</DialogTitle>
              <DialogDescription>
                Configure your quiz preferences and behavior.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Time Limit (minutes)
                </label>
                <Input type="number" placeholder="30" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Passing Score (%)</label>
                <Input type="number" placeholder="70" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Attempts Allowed</label>
                <Input type="number" placeholder="3" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Save Settings</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Quiz
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Quiz</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this quiz? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Average Time</p>
                <p className="text-2xl font-bold">12:34</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Attempts</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Button Variants Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
          <CardDescription>
            Different button styles available in shadcn/ui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Example */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Quiz Creation</CardTitle>
          <CardDescription>
            Create a new quiz with basic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quiz Title</label>
              <Input placeholder="Enter quiz title" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input placeholder="Select category" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea placeholder="Enter quiz description" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button>Create Quiz</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
