"use client";

import { useState } from "react";

interface AIFeedbackPopupProps {
  selectedText: string;
  fullContext: string;
  position: { x: number; y: number };
  onClose: () => void;
  onApplyEdit?: (newText: string) => void;
}

const QUICK_QUESTIONS = [
  { label: "What's working?", question: "What's working well in this passage? Be specific." },
  { label: "What's weak?", question: "What's the weakest part of this passage and why?" },
  { label: "How's the voice?", question: "How would you describe the voice here? Is it consistent?" },
  { label: "Pacing check", question: "How's the pacing? Does it drag or rush anywhere?" },
];

const QUICK_ASSISTS = [
  { label: "Fix grammar", type: "grammar" as const },
  { label: "Improve clarity", type: "clarity" as const },
  { label: "Make stronger", type: "stronger" as const },
  { label: "Make shorter", type: "shorter" as const },
];

export default function AIFeedbackPopup({
  selectedText,
  fullContext,
  position,
  onClose,
  onApplyEdit,
}: AIFeedbackPopupProps) {
  const [mode, setMode] = useState<"menu" | "question" | "feedback" | "assist">("menu");
  const [customQuestion, setCustomQuestion] = useState("");
  const [feedback, setFeedback] = useState("");
  const [assistResult, setAssistResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickQuestion = async (question: string) => {
    setMode("feedback");
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedText, fullContext, question }),
      });
      const data = await res.json();
      setFeedback(data.feedback || "Unable to get feedback.");
    } catch {
      setFeedback("Error getting feedback. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomQuestion = async () => {
    if (!customQuestion.trim()) return;
    await handleQuickQuestion(customQuestion);
  };

  const handleQuickAssist = async (type: "grammar" | "clarity" | "stronger" | "shorter") => {
    setMode("assist");
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText, assistType: type }),
      });
      const data = await res.json();
      setAssistResult(data.result || selectedText);
    } catch {
      setAssistResult(selectedText);
    } finally {
      setIsLoading(false);
    }
  };

  const applyAssist = () => {
    if (onApplyEdit && assistResult) {
      onApplyEdit(assistResult);
    }
    onClose();
  };

  return (
    <div
      className="fixed bg-white rounded-lg shadow-xl border border-zinc-200 z-50 w-80"
      style={{
        left: Math.min(position.x, window.innerWidth - 340),
        top: Math.min(position.y + 10, window.innerHeight - 400),
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-3 py-2 border-b border-zinc-100">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          AI Consultant
        </span>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {mode === "menu" && (
          <>
            {/* Selected text preview */}
            <div className="text-xs text-zinc-400 mb-2">Selected:</div>
            <div className="text-sm text-zinc-700 mb-3 italic line-clamp-2">
              "{selectedText.slice(0, 100)}{selectedText.length > 100 ? "..." : ""}"
            </div>

            {/* Quick questions */}
            <div className="text-xs text-zinc-400 mb-2">Quick feedback:</div>
            <div className="grid grid-cols-2 gap-1 mb-3">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => handleQuickQuestion(q.question)}
                  className="text-xs px-2 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-700 text-left"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Quick assists */}
            <div className="text-xs text-zinc-400 mb-2">Quick edits:</div>
            <div className="grid grid-cols-2 gap-1 mb-3">
              {QUICK_ASSISTS.map((a) => (
                <button
                  key={a.type}
                  onClick={() => handleQuickAssist(a.type)}
                  className="text-xs px-2 py-1.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-700 text-left"
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* Custom question */}
            <div className="text-xs text-zinc-400 mb-2">Ask anything:</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomQuestion()}
                placeholder="Your question..."
                className="flex-1 text-sm px-2 py-1.5 border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <button
                onClick={handleCustomQuestion}
                className="px-3 py-1.5 bg-zinc-900 text-white text-sm rounded hover:bg-zinc-800"
              >
                Ask
              </button>
            </div>
          </>
        )}

        {mode === "feedback" && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900"></div>
              </div>
            ) : (
              <>
                <div className="text-sm text-zinc-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {feedback}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-zinc-100">
                  <button
                    onClick={() => setMode("menu")}
                    className="text-xs text-zinc-500 hover:text-zinc-700"
                  >
                    ← Ask another
                  </button>
                  <button
                    onClick={onClose}
                    className="text-xs px-3 py-1 bg-zinc-900 text-white rounded hover:bg-zinc-800"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {mode === "assist" && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900"></div>
              </div>
            ) : (
              <>
                <div className="text-xs text-zinc-400 mb-2">Suggested edit:</div>
                <div className="text-sm text-zinc-700 whitespace-pre-wrap max-h-48 overflow-y-auto bg-green-50 p-2 rounded border border-green-200">
                  {assistResult}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-zinc-100">
                  <button
                    onClick={() => setMode("menu")}
                    className="text-xs text-zinc-500 hover:text-zinc-700"
                  >
                    ← Back
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={onClose}
                      className="text-xs px-3 py-1 text-zinc-600 hover:text-zinc-800"
                    >
                      Discard
                    </button>
                    <button
                      onClick={applyAssist}
                      className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
