"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import type { Project } from "@/lib/db/schema";

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (res.ok) {
        const project = await res.json();
        // Navigate directly to the first chapter
        router.push(`/editor/${project.firstChapterId}`);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  }

  async function handleDeleteProject(projectId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== projectId));
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  }

  async function handleOpenProject(projectId: string) {
    // Get the first chapter and navigate to it
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const project = await res.json();
        if (project.chapters && project.chapters.length > 0) {
          router.push(`/editor/${project.chapters[0].id}`);
        }
      }
    } catch (error) {
      console.error("Failed to open project:", error);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-zinc-900">PennedWorks</h1>
          <p className="text-zinc-500 mt-1">Your writing, your vision</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* New Project Form */}
        {isCreating ? (
          <form onSubmit={handleCreateProject} className="mb-8 p-6 bg-white rounded-lg border border-zinc-200">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Project Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="My Novel"
              autoFocus
              className="w-full px-4 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-400 mb-4"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800"
              >
                Create Project
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewTitle("");
                }}
                className="px-4 py-2 text-zinc-600 hover:text-zinc-900"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="mb-8 w-full p-6 border-2 border-dashed border-zinc-300 rounded-lg text-zinc-500 hover:border-zinc-400 hover:text-zinc-600 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        )}

        {/* Projects List */}
        {isLoading ? (
          <div className="text-center py-12 text-zinc-400">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500">No projects yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleOpenProject(project.id)}
                className="p-5 bg-white rounded-lg border border-zinc-200 hover:border-zinc-300 cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700">
                      {project.title}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-zinc-500 mt-1">{project.description}</p>
                    )}
                    <p className="text-xs text-zinc-400 mt-2">
                      Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete project"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
