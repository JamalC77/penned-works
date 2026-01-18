"use client";

import { useState } from "react";

interface ExpedienceModeProps {
  context: string;
  onGenerate: (content: string) => void;
  onClose: () => void;
}

export default function ExpedienceMode({ context, onGenerate, onClose }: ExpedienceModeProps) {
  const [description, setDescription] = useState("");
  const [styleNotes, setStyleNotes] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"describe" | "review">("describe");

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          context,
          styleReference: styleNotes || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setGeneratedContent(`Error: ${data.error || "Failed to generate content"}. Make sure your ANTHROPIC_API_KEY is set in .env.local`);
      } else if (data.content) {
        setGeneratedContent(data.content);
      } else {
        setGeneratedContent("No content was generated. Please try again with a different description.");
      }
      setStep("review");
    } catch (err) {
      setGeneratedContent(`Error generating content: ${err instanceof Error ? err.message : "Unknown error"}. Please check your API key and try again.`);
      setStep("review");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    onGenerate(generatedContent);
    onClose();
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Expedience Mode</h2>
            <p className="text-sm text-zinc-500">Describe what you want, AI drafts it</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "describe" && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Describe what you want written
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a scene where Sarah confronts her mother about the letter. Tone is tense, Sarah is holding back tears, mother is defensive. Ends with Sarah walking out without resolution..."
                  rows={6}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Be as detailed as you want. Include tone, mood, character motivations, key beats, how it should end.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Style notes (optional)
                </label>
                <textarea
                  value={styleNotes}
                  onChange={(e) => setStyleNotes(e.target.value)}
                  placeholder="Short sentences. Present tense. Minimal dialogue tags..."
                  rows={2}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm"
                />
              </div>

              {context && (
                <div className="mb-4 p-3 bg-zinc-50 rounded-md">
                  <div className="text-xs font-medium text-zinc-500 mb-1">Using your existing work for voice/style:</div>
                  <div className="text-xs text-zinc-400 line-clamp-2">
                    {context.slice(0, 200)}...
                  </div>
                </div>
              )}
            </>
          )}

          {step === "review" && (
            <>
              <div className="mb-4">
                <div className="text-sm font-medium text-zinc-700 mb-2">Generated draft:</div>
                <div className="p-4 bg-zinc-50 rounded-md border border-zinc-200 max-h-96 overflow-y-auto">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {generatedContent}
                  </div>
                </div>
              </div>

              <div className="text-xs text-zinc-500">
                Review the draft above. You can accept it, regenerate with the same description, or go back to edit your description.
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 flex justify-between">
          {step === "describe" && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-zinc-600 hover:text-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!description.trim() || isLoading}
                className="px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  "Generate Draft"
                )}
              </button>
            </>
          )}

          {step === "review" && (
            <>
              <button
                onClick={() => setStep("describe")}
                className="px-4 py-2 text-zinc-600 hover:text-zinc-800"
              >
                ← Edit Description
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleRegenerate}
                  disabled={isLoading}
                  className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-md hover:bg-zinc-50 disabled:opacity-50"
                >
                  {isLoading ? "Regenerating..." : "Regenerate"}
                </button>
                <button
                  onClick={handleAccept}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Insert into Editor
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
