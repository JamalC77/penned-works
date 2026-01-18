"use client";

import { useEffect, useState, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Editor, { EditorHandle } from "@/components/editor/Editor";
import VersionHistory from "@/components/editor/VersionHistory";
import ExpedienceMode from "@/components/editor/ExpedienceMode";
import StoryWeaverMode from "@/components/editor/StoryWeaverMode";
import StoryBiblePanel from "@/components/storybible/StoryBiblePanel";
import type { Chapter, Project } from "@/lib/db";

type WritingMode = "pure" | "expedience" | "storyweaver";

interface ProjectWithChapters extends Project {
  chapters: Chapter[];
}

export default function EditorPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = use(params);
  const router = useRouter();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [project, setProject] = useState<ProjectWithChapters | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [showVersions, setShowVersions] = useState(false);
  const [currentMode, setCurrentMode] = useState<WritingMode>("pure");
  const [showExpedience, setShowExpedience] = useState(false);
  const [showStoryWeaver, setShowStoryWeaver] = useState(false);
  const [showStoryBible, setShowStoryBible] = useState(false);
  const editorRef = useRef<EditorHandle>(null);

  useEffect(() => {
    async function loadChapter() {
      try {
        const res = await fetch(`/api/chapters/${chapterId}`);
        if (!res.ok) throw new Error("Failed to load chapter");
        const chapterData = await res.json();
        setChapter(chapterData);
        setTitleInput(chapterData.title);

        // Load project with all chapters for sidebar
        const projectRes = await fetch(`/api/projects/${chapterData.projectId}`);
        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setProject(projectData);
        }
      } catch (error) {
        console.error("Failed to load chapter:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadChapter();
  }, [chapterId]);

  const handleSave = useCallback(async (content: string) => {
    await fetch(`/api/chapters/${chapterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    // Update local chapter state
    setChapter(prev => prev ? { ...prev, content } : null);
  }, [chapterId]);

  const handleRestoreVersion = async (content: string) => {
    // Save current state as a version first
    await fetch(`/api/chapters/${chapterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: chapter?.content,
        createVersion: true,
        versionLabel: "Before restore"
      }),
    });

    // Update with restored content
    await fetch(`/api/chapters/${chapterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    // Update local state and editor
    setChapter(prev => prev ? { ...prev, content } : null);
    if (editorRef.current) {
      editorRef.current.setContent(content);
    }
  };

  const handleTitleSave = async () => {
    if (!titleInput.trim() || titleInput === chapter?.title) {
      setIsEditingTitle(false);
      return;
    }

    await fetch(`/api/chapters/${chapterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleInput }),
    });

    setChapter(prev => prev ? { ...prev, title: titleInput } : null);
    setIsEditingTitle(false);
  };

  const handleAddChapter = async () => {
    if (!project) return;

    const res = await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id }),
    });

    if (res.ok) {
      const newChapter = await res.json();
      router.push(`/editor/${newChapter.id}`);
    }
  };

  const handleExpedienceGenerate = (content: string) => {
    if (editorRef.current) {
      editorRef.current.insertContent(content);
    }
  };

  const handleStoryWeaverExport = (content: string) => {
    if (editorRef.current) {
      editorRef.current.insertContent(content);
    }
  };

  const handleModeChange = (mode: WritingMode) => {
    setCurrentMode(mode);
    if (mode === "expedience") {
      setShowExpedience(true);
    } else if (mode === "storyweaver") {
      setShowStoryWeaver(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500">Chapter not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-50 border-r border-zinc-200 flex flex-col h-screen fixed left-0 top-0">
        <div className="p-4 border-b border-zinc-200">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Projects
          </button>
          <h2 className="font-semibold text-zinc-900 mt-2 truncate" title={project?.title}>
            {project?.title}
          </h2>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider px-2 py-1">
            Chapters
          </div>
          {project?.chapters.map((ch) => (
            <button
              key={ch.id}
              onClick={() => router.push(`/editor/${ch.id}`)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                ch.id === chapterId
                  ? "bg-zinc-200 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <div className="truncate">{ch.title}</div>
              <div className="text-xs text-zinc-400">{ch.wordCount?.toLocaleString() || 0} words</div>
            </button>
          ))}

          <button
            onClick={handleAddChapter}
            className="w-full text-left px-3 py-2 rounded text-sm text-zinc-500 hover:bg-zinc-100 flex items-center gap-2 mt-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Chapter
          </button>
        </nav>

        {/* Tools */}
        <div className="p-4 border-t border-zinc-200 space-y-1">
          <button
            onClick={() => setShowStoryBible(true)}
            className="w-full text-left px-3 py-2 rounded text-sm text-zinc-600 hover:bg-zinc-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Story Bible
          </button>
          <button
            onClick={() => setShowVersions(true)}
            className="w-full text-left px-3 py-2 rounded text-sm text-zinc-600 hover:bg-zinc-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Version History
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-4 border-t border-zinc-200">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Writing Mode
          </div>
          <div className="space-y-1">
            <button
              onClick={() => handleModeChange("pure")}
              className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                currentMode === "pure"
                  ? "bg-zinc-200 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Pure
            </button>
            <button
              onClick={() => handleModeChange("expedience")}
              className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                currentMode === "expedience"
                  ? "bg-zinc-200 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Expedience
            </button>
            <button
              onClick={() => handleModeChange("storyweaver")}
              className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                currentMode === "storyweaver"
                  ? "bg-zinc-200 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
              Story Weaver
            </button>
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            {currentMode === "pure" && "Just you and the page. Select text for AI feedback."}
            {currentMode === "expedience" && "Describe what you want, AI drafts it."}
            {currentMode === "storyweaver" && "Interactive story discovery."}
          </p>
        </div>
      </aside>

      {/* Main editor area */}
      <main className="flex-1 ml-64">
        <div className="max-w-3xl mx-auto px-8 py-12">
          {/* Chapter title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") {
                  setTitleInput(chapter.title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="text-3xl font-bold text-zinc-900 w-full border-b-2 border-zinc-300 focus:border-zinc-500 outline-none pb-2 mb-8"
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="text-3xl font-bold text-zinc-900 mb-8 cursor-text hover:bg-zinc-50 rounded px-1 -mx-1"
            >
              {chapter.title}
            </h1>
          )}

          {/* Editor */}
          <Editor
            ref={editorRef}
            initialContent={chapter.content || ""}
            onSave={handleSave}
            placeholder="Begin your story..."
            mode={currentMode}
            fullContext={chapter.content || ""}
          />
        </div>
      </main>

      {/* Version History Modal */}
      <VersionHistory
        chapterId={chapterId}
        isOpen={showVersions}
        onClose={() => setShowVersions(false)}
        onRestore={handleRestoreVersion}
      />

      {/* Expedience Mode Modal */}
      {showExpedience && (
        <ExpedienceMode
          context={chapter.content || ""}
          onGenerate={handleExpedienceGenerate}
          onClose={() => {
            setShowExpedience(false);
            setCurrentMode("pure");
          }}
        />
      )}

      {/* Story Weaver Mode */}
      {showStoryWeaver && (
        <StoryWeaverMode
          initialContext={chapter.content || ""}
          onExport={handleStoryWeaverExport}
          onClose={() => {
            setShowStoryWeaver(false);
            setCurrentMode("pure");
          }}
        />
      )}

      {/* Story Bible Panel */}
      {project && (
        <StoryBiblePanel
          projectId={project.id}
          isOpen={showStoryBible}
          onClose={() => setShowStoryBible(false)}
        />
      )}
    </div>
  );
}
