"use client";

import { useState } from "react";

interface StoryWeaverModeProps {
  initialContext?: string;
  onExport: (content: string) => void;
  onClose: () => void;
}

interface StoryBeat {
  type: "narrative" | "choice";
  content: string;
  choiceMade?: string;
}

export default function StoryWeaverMode({ initialContext, onExport, onClose }: StoryWeaverModeProps) {
  const [storyBeats, setStoryBeats] = useState<StoryBeat[]>([]);
  const [currentChoices, setCurrentChoices] = useState<string[]>([]);
  const [customChoice, setCustomChoice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [setupPrompt, setSetupPrompt] = useState(initialContext || "");

  const getFullStory = () => {
    return storyBeats
      .filter((beat) => beat.type === "narrative")
      .map((beat) => beat.content)
      .join("\n\n");
  };

  const startStory = async () => {
    setIsLoading(true);
    setHasStarted(true);

    try {
      const res = await fetch("/api/ai/storyweaver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyContext: setupPrompt,
          authorChoice: setupPrompt ? undefined : "Begin a new story",
        }),
      });
      const data = await res.json();

      setStoryBeats([{ type: "narrative", content: data.narrative }]);
      setCurrentChoices(data.choices || []);
    } catch {
      setStoryBeats([{ type: "narrative", content: "Error starting story. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const makeChoice = async (choice: string) => {
    setIsLoading(true);

    // Add the choice to the story
    setStoryBeats((prev) => [...prev, { type: "choice", content: choice, choiceMade: choice }]);
    setCurrentChoices([]);

    try {
      const res = await fetch("/api/ai/storyweaver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyContext: getFullStory(),
          authorChoice: choice,
        }),
      });
      const data = await res.json();

      setStoryBeats((prev) => [...prev, { type: "narrative", content: data.narrative }]);
      setCurrentChoices(data.choices || []);
    } catch {
      setStoryBeats((prev) => [
        ...prev,
        { type: "narrative", content: "Error continuing story. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomChoice = () => {
    if (customChoice.trim()) {
      makeChoice(customChoice);
      setCustomChoice("");
    }
  };

  const handleExport = () => {
    const fullStory = getFullStory();
    onExport(fullStory);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-900 flex flex-col z-50">
      {/* Header */}
      <div className="bg-zinc-800 px-6 py-4 flex justify-between items-center border-b border-zinc-700">
        <div>
          <h2 className="text-lg font-semibold text-white">Story Weaver</h2>
          <p className="text-sm text-zinc-400">Discover your story through choices</p>
        </div>
        <div className="flex items-center gap-3">
          {hasStarted && storyBeats.length > 0 && (
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Export to Editor
            </button>
          )}
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Story area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-8 px-6">
          {!hasStarted ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-white mb-4">Begin Your Story</h3>
              <p className="text-zinc-400 mb-6">
                Optionally provide some context or starting point. Or leave blank to start fresh.
              </p>
              <textarea
                value={setupPrompt}
                onChange={(e) => setSetupPrompt(e.target.value)}
                placeholder="A detective receives a mysterious letter... / A young woman returns to her hometown after 10 years... / Leave blank for a surprise..."
                rows={4}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 mb-4"
              />
              <button
                onClick={startStory}
                disabled={isLoading}
                className="px-6 py-3 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 disabled:opacity-50"
              >
                {isLoading ? "Starting..." : "Begin the Journey"}
              </button>
            </div>
          ) : (
            <>
              {/* Story beats */}
              {storyBeats.map((beat, index) => (
                <div key={index} className="mb-6">
                  {beat.type === "narrative" ? (
                    <div className="prose prose-invert prose-lg max-w-none">
                      <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
                        {beat.content}
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-500 italic pl-4 border-l-2 border-zinc-600">
                      You chose: {beat.choiceMade}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}

              {/* Choices */}
              {!isLoading && currentChoices.length > 0 && (
                <div className="mt-8 pt-8 border-t border-zinc-700">
                  <p className="text-zinc-400 text-sm mb-4">What do you do?</p>
                  <div className="space-y-2">
                    {currentChoices.map((choice, index) => (
                      <button
                        key={index}
                        onClick={() => makeChoice(choice)}
                        className="w-full text-left px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-200 transition-colors"
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    <p className="text-zinc-500 text-xs mb-2">Or write your own action:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customChoice}
                        onChange={(e) => setCustomChoice(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCustomChoice()}
                        placeholder="I decide to..."
                        className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                      />
                      <button
                        onClick={handleCustomChoice}
                        disabled={!customChoice.trim()}
                        className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 disabled:opacity-50"
                      >
                        Go
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Story stats */}
      {hasStarted && storyBeats.length > 0 && (
        <div className="bg-zinc-800 px-6 py-3 border-t border-zinc-700 flex justify-between text-sm text-zinc-400">
          <span>{storyBeats.filter((b) => b.type === "choice").length} choices made</span>
          <span>
            {getFullStory().split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
      )}
    </div>
  );
}
