"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import AIFeedbackPopup from "./AIFeedbackPopup";

type WritingMode = "pure" | "expedience" | "storyweaver";

interface EditorProps {
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  placeholder?: string;
  mode?: WritingMode;
  fullContext?: string;
}

export interface EditorHandle {
  setContent: (content: string) => void;
  insertContent: (content: string) => void;
}

interface SelectionPopup {
  text: string;
  position: { x: number; y: number };
}

const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  { initialContent, onSave, placeholder = "Start writing...", mode = "pure", fullContext = "" },
  ref
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectionPopup, setSelectionPopup] = useState<SelectionPopup | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef(initialContent);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[calc(100vh-200px)]",
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();

      // Debounced auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (content !== lastContentRef.current) {
          handleSave(content);
        }
      }, 1500);
    },
    onSelectionUpdate: ({ editor }) => {
      // Only show popup in pure mode
      if (mode !== "pure") {
        setSelectionPopup(null);
        return;
      }

      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, " ");

      if (selectedText.length > 10) {
        // Get the position of the selection
        const coords = editor.view.coordsAtPos(to);
        setSelectionPopup({
          text: selectedText,
          position: { x: coords.left, y: coords.bottom },
        });
      } else {
        setSelectionPopup(null);
      }
    },
  });

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    setContent: (content: string) => {
      if (editor) {
        editor.commands.setContent(content);
        lastContentRef.current = content;
      }
    },
    insertContent: (content: string) => {
      if (editor) {
        // Convert plain text paragraphs to HTML paragraphs
        // Double newlines = new paragraph, single newlines within paragraphs = <br>
        const htmlContent = content
          .split(/\n\n+/)
          .filter(p => p.trim())
          .map(p => {
            // Handle single newlines within paragraphs as line breaks
            const withBreaks = p.trim().replace(/\n/g, '<br>');
            return `<p>${withBreaks}</p>`;
          })
          .join("");

        // Insert at current cursor position or at end
        const { to } = editor.state.selection;
        editor.chain().focus().insertContentAt(to, htmlContent).run();
        // Trigger save
        handleSave(editor.getHTML());
      }
    },
  }), [editor]);

  const handleSave = useCallback(async (content: string) => {
    setIsSaving(true);
    try {
      await onSave(content);
      lastContentRef.current = content;
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  const handleApplyEdit = useCallback((newText: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, newText).run();
    handleSave(editor.getHTML());
  }, [editor, handleSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcut for manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (editor) {
          handleSave(editor.getHTML());
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, handleSave]);

  // Close popup on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-ai-popup]')) {
        // Don't close if clicking inside popup
        if (selectionPopup && !target.closest('.ai-popup-container')) {
          setSelectionPopup(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectionPopup]);

  if (!editor) {
    return <div className="animate-pulse bg-zinc-100 h-96 rounded" />;
  }

  const wordCount = editor.storage.characterCount.words();
  const charCount = editor.storage.characterCount.characters();

  return (
    <div className="relative">
      {/* Status bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-50 border-t border-zinc-200 px-4 py-2 flex justify-between items-center text-sm text-zinc-500 z-10">
        <div className="flex items-center gap-4">
          <span>{wordCount.toLocaleString()} words</span>
          <span>{charCount.toLocaleString()} characters</span>
          <span className="text-zinc-400">|</span>
          <span className="capitalize">{mode} mode</span>
        </div>
        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-amber-600">Saving...</span>
          ) : lastSaved ? (
            <span className="text-green-600">
              Saved at {lastSaved.toLocaleTimeString()}
            </span>
          ) : null}
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="pb-16" />

      {/* AI Feedback Popup (Pure Mode only) */}
      {selectionPopup && mode === "pure" && (
        <div className="ai-popup-container">
          <AIFeedbackPopup
            selectedText={selectionPopup.text}
            fullContext={fullContext || editor.getHTML()}
            position={selectionPopup.position}
            onClose={() => setSelectionPopup(null)}
            onApplyEdit={handleApplyEdit}
          />
        </div>
      )}
    </div>
  );
});

export default Editor;
