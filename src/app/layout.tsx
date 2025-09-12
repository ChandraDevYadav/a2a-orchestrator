import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { A2AAgentStatus } from "@/components/A2AAgentStatus";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quiz Creator - Agent2Agent Protocol",
  description:
    "Create and take quizzes using AI-powered generation with Agent2Agent Protocol",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          {children}
        </div>
        <Toaster />
        {/* <A2AAgentStatus /> */}
      </body>
    </html>
  );
}
