import { Editor } from '@tiptap/react'
import { cn } from '@/lib/utils'

interface ToolbarButtonProps {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}

function ToolbarButton({ active, onClick, title, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2.5 text-sm font-semibold transition-all',
        active
          ? 'bg-sky-900 text-white shadow-[0_18px_32px_-24px_rgba(12,67,88,0.9)]'
          : 'text-zinc-600 hover:bg-white hover:text-zinc-900',
      )}
    >
      {children}
    </button>
  )
}

interface EditorToolbarProps {
  editor: Editor
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  return (
    <div className="border-b border-stone-200/80 bg-[rgba(246,241,232,0.6)] px-3 py-3 backdrop-blur-sm sm:px-5">
      <div className="flex items-center gap-1 overflow-x-auto">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrito (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Itálico (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Tachado"
        >
          <s>S</s>
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-zinc-200" />

        {[1, 2, 3].map(level => (
          <ToolbarButton
            key={level}
            active={editor.isActive('heading', { level })}
            onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()}
            title={`Título ${level}`}
          >
            H{level}
          </ToolbarButton>
        ))}

        <div className="mx-1 h-5 w-px bg-zinc-200" />

        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista"
        >
          •—
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
        >
          1.
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Bloco de código"
        >
          {'</>'}
        </ToolbarButton>
      </div>
    </div>
  )
}
