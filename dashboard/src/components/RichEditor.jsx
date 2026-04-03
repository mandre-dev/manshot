// RichEditor.jsx — Manshot
// Editor de texto rico com botões B / I / U

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useState } from 'react'

function ToolButton({ active, label, onClick, children }) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  return (
    <button
      type="button"
      style={{
        background: active ? '#FF6B0033' : hovered ? '#231607' : '#1a1208',
        border: `1px solid ${active || hovered ? '#FF6B00' : '#2a1a0a'}`,
        borderRadius: '5px',
        color: active || hovered ? '#FF6B00' : '#e5e7eb',
        cursor: 'pointer',
        padding: '4px 10px',
        fontSize: '12px',
        fontFamily: "'Space Mono', monospace",
        fontWeight: '700',
        transform: pressed ? 'translateY(1px) scale(0.98)' : hovered ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: pressed ? 'inset 0 0 0 1px #FF6B0077' : hovered ? '0 4px 12px #FF6B001a' : 'none',
        transition: 'all 0.14s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        setPressed(false)
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  )
}

export default function RichEditor({ value, onChange, placeholder = 'Digite sua mensagem...' }) {
  const [wrapperHovered, setWrapperHovered] = useState(false)
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
        boxShadow: wrapperHovered ? '0 5px 16px rgba(255,107,0,0.12)' : 'none',
        transition: 'box-shadow 0.16s ease',
      }}>
        <ToolButton active={editor.isActive('bold')} label="Negrito" onClick={() => editor.chain().focus().toggleBold().run()}>
          N
        </ToolButton>
        <ToolButton active={editor.isActive('italic')} label="Itálico" onClick={() => editor.chain().focus().toggleItalic().run()}>
          I
        </ToolButton>
        <ToolButton active={editor.isActive('underline')} label="Sublinhado" onClick={() => editor.chain().focus().toggleUnderline().run()}>
          S
        </ToolButton>
        <div style={{ width: '1px', background: '#2a1a0a', margin: '0 4px' }} />
        <ToolButton active={false} label="Limpar formatação" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          ✕ limpar
        </ToolButton>
      </div>

      {/* Editor */}
      <div
        onMouseEnter={() => setWrapperHovered(true)}
        onMouseLeave={() => setWrapperHovered(false)}
        style={{
          borderRadius: '0 0 8px 8px',
          boxShadow: wrapperHovered ? '0 0 0 2px #FF6B0022, 0 10px 24px #FF6B0015' : 'none',
          transition: 'box-shadow 0.16s ease, transform 0.12s ease',
          transform: wrapperHovered ? 'translateY(-1px)' : 'translateY(0)',
        }}
      >
        <EditorContent editor={editor} />
      </div>

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