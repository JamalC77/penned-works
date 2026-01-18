"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import type { Version } from "@/lib/db";

interface VersionHistoryProps {
  chapterId: string;
  onRestore: (content: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function VersionHistory({ chapterId, onRestore, isOpen, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, chapterId]);

  async function loadVersions() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (error) {
      console.error("Failed to load versions:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleRestore(version: Version) {
    if (confirm("Restore this version? Your current work will be saved as a new version first.")) {
      onRestore(version.content);
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-zinc-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-zinc-900">Version History</h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Version list */}
          <div className="w-64 border-r border-zinc-200 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-zinc-400">Loading...</div>
            ) : versions.length === 0 ? (
              <div className="p-4 text-zinc-500 text-sm">
                No saved versions yet. Versions are created when you make significant edits.
              </div>
            ) : (
              <div className="p-2">
                {versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`w-full text-left p-3 rounded mb-1 ${
                      selectedVersion?.id === version.id
                        ? "bg-zinc-100"
                        : "hover:bg-zinc-50"
                    }`}
                  >
                    <div className="text-sm text-zinc-900">
                      {version.label || formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {version.wordCount?.toLocaleString() || 0} words
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedVersion ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-zinc-500">
                    {new Date(selectedVersion.createdAt).toLocaleString()}
                  </div>
                  <button
                    onClick={() => handleRestore(selectedVersion)}
                    className="px-3 py-1 bg-zinc-900 text-white text-sm rounded hover:bg-zinc-800"
                  >
                    Restore This Version
                  </button>
                </div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
                />
              </div>
            ) : (
              <div className="text-zinc-400 text-center py-12">
                Select a version to preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
