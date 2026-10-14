"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Code2, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Redo2, Strikethrough, Undo2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";

function Tool({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn("grid size-8 place-items-center rounded-md text-muted transition hover:bg-line hover:text-fg disabled:opacity-40", active && "bg-primary/15 text-ink")}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = (): void => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (leave empty to remove)", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };
  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5 border-b border-line p-1.5">
      <Tool label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></Tool>
      <Tool label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></Tool>
      <Tool label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="size-4" /></Tool>
      <Tool label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></Tool>
      <Tool label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></Tool>
      <Tool label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></Tool>
      <Tool label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></Tool>
      <Tool label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></Tool>
      <Tool label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 className="size-4" /></Tool>
      <Tool label="Link" active={editor.isActive("link")} onClick={setLink}><Link2 className="size-4" /></Tool>
      <span className="mx-1 w-px bg-line" aria-hidden="true" />
      <Tool label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="size-4" /></Tool>
      <Tool label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="size-4" /></Tool>
    </div>
  );
}

/** Tiptap editor producing HTML (sanitised again on the server). Empty content is reported as "". */
export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  invalid?: boolean | undefined;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }),
      Placeholder.configure({ placeholder: placeholder ?? "Write something…" }),
    ],
    content: value,
    editorProps: {
      attributes: { id, class: "prose-content min-h-52 max-h-[28rem] overflow-y-auto p-4 focus:outline-none", "aria-label": "Rich text editor" },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.isEmpty ? "" : e.getHTML());
    },
  });

  // Sync when the form is reset from outside (e.g. after loading the record).
  useEffect(() => {
    if (editor && value !== (editor.isEmpty ? "" : editor.getHTML())) editor.commands.setContent(value, { emitUpdate: false });
  }, [value, editor]);

  return (
    <div className={cn("overflow-hidden rounded-lg border border-line bg-bg focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30", invalid && "border-red-500")}>
      {editor ? <Toolbar editor={editor} /> : <div className="h-11 border-b border-line" />}
      <EditorContent editor={editor} />
    </div>
  );
}
