// RichEditor.jsx — Manshot
// Editor de texto rico com botões B / I / U

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

const btnStyle = (active) => ({
  background: active ? '#FF6B0033' : '#1a1208',
  border: `1px solid ${active ? '#FF6B00' : '#2a1a0a'}`,
  borderRadius: '5px',
  color: active ? '#FF6B00' : '#e5e7eb',
  cursor: 'pointer',
  padding: '4px 10px',
  fontSize: '12px',
  fontFamily: "'Space Mono', monospace",
  fontWeight: '700',
  transition: 'all 0.15s',
})

export default function RichEditor({ value, onChange, placeholder = 'Digite sua mensagem...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'rich-editor-content',
        style: [
          'background: #1a1208',
          'border: 1px solid #2a1a0a',
          'border-radius: 0 0 8px 8px',
          'padding: 12px 14px',
          'min-height: 100px',
          'color: #e5e7eb',
          'font-size: 13px',
          'font-family: Space Mono, monospace',
          'outline: none',
          'line-height: 1.6',
        ].join(';'),
      },
    },
  })

  useEffect(() => {
    if (!editor) return

    const nextContent = value || ''
    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, false)
    }
  }, [editor, value])

  if (!editor) return null

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: '4px', padding: '6px 8px',
        background: '#111827', border: '1px solid #2a1a0a',
        borderBottom: 'none', borderRadius: '8px 8px 0 0',
      }}>
        <button type="button"
          style={btnStyle(editor.isActive('bold'))}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          N
        </button>
        <button type="button"
          style={btnStyle(editor.isActive('italic'))}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          I
        </button>
        <button type="button"
          style={btnStyle(editor.isActive('underline'))}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          S
        </button>
        <div style={{ width: '1px', background: '#2a1a0a', margin: '0 4px' }} />
        <button type="button"
          style={btnStyle(false)}
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          ✕ limpar
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      <style>{`
        .rich-editor-content .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #6b7280;
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}