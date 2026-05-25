'use client'
// Must be client component — it's an interactive browser editor

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

// Toolbar button — reusable small component
// active = currently applied (e.g. bold is ON)
function ToolbarButton({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      // type="button" is CRITICAL inside forms
      // without it, clicking toolbar buttons submits the form
      onMouseDown={(e) => {
        e.preventDefault()
        // preventDefault stops the editor from losing focus
        // when you click a toolbar button
        onClick()
      }}
      title={title}
      className={`p-2 rounded text-sm transition-colors ${
        active
          ? 'bg-gray-900 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

export default function TiptapEditor({ value, onChange }) {
  // value = the HTML string coming from parent (for edit mode)
  // onChange = function to call whenever content changes
  // this pattern is called "controlled component"

  const editor = useEditor({
    extensions: [
      StarterKit,
      // StarterKit includes: Bold, Italic, Headings (H1-H6),
      // BulletList, OrderedList, Blockquote, Code, CodeBlock,
      // HorizontalRule, Strike, Paragraph — all in one

      Image.configure({
        // Allow images to have HTML attributes
        inline: false,
        allowBase64: true,
        // allowBase64 lets writers paste images directly
        // In production you'd upload to a server instead
      }),

      Link.configure({
        openOnClick: false,
        // Don't navigate when clicking links inside the editor
        // Only navigate on the public-facing blog
      }),

      Placeholder.configure({
        placeholder: 'Start writing your article...',
      }),
    ],

    content: value || '',
    // Set initial content — empty string for new posts
    // For edit mode, value will be the existing HTML

    onUpdate: ({ editor }) => {
      // Fires every time content changes
      // editor.getHTML() returns the full HTML string
      // We pass it up to the parent form via onChange
      onChange(editor.getHTML())
    },

    editorProps: {
      attributes: {
        // Tailwind prose class makes the editor content
        // look like a real article while writing
        class: 'prose prose-lg max-w-none focus:outline-none min-h-96 px-4 py-3',
      },
    },
  })

  // Sync external value changes into the editor
  // This handles the edit post case where value loads after editor mounts
  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50">

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          // chain() — start a chain of commands
          // focus() — keep editor focused after clicking toolbar
          // toggleBold() — toggle bold on/off
          // run() — execute the chain
          active={editor.isActive('bold')}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <s>S</s>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Inline code"
        >
          {'<>'}
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />
        {/* Divider between toolbar sections */}

        {/* Headings */}
        {[1, 2, 3].map((level) => (
          <ToolbarButton
            key={level}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level }).run()
            }
            active={editor.isActive('heading', { level })}
            title={`Heading ${level}`}
          >
            H{level}
          </ToolbarButton>
        ))}

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          • List
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered list"
        >
          1. List
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Block elements */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          " "
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code block"
        >
          {'{ }'}
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          active={false}
          title="Horizontal rule"
        >
          —
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Link */}
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Enter URL:')
            // Simple prompt for now — in production you'd use a modal
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          active={editor.isActive('link')}
          title="Add link"
        >
          🔗
        </ToolbarButton>

        {/* Image */}
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Enter image URL:')
            if (url) {
              editor.chain().focus().setImage({ src: url }).run()
            }
          }}
          active={false}
          title="Insert image"
        >
          🖼
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          active={false}
          title="Undo"
        >
          ↩
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          active={false}
          title="Redo"
        >
          ↪
        </ToolbarButton>

      </div>

      {/* The actual editable content area */}
      <EditorContent editor={editor} />

    </div>
  )
}