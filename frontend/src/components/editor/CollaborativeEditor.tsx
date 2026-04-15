import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Placeholder from '@tiptap/extension-placeholder'
import { SocketIOProvider } from '@/services/SocketIOProvider'
import { EditorToolbar } from './EditorToolbar'

interface CollaborativeEditorProps {
  provider: SocketIOProvider
}

export function CollaborativeEditor({ provider }: CollaborativeEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: provider.doc }),
      CollaborationCursor.configure({
        provider,
        user: provider.awareness.getLocalState()?.user ?? { name: 'Anônimo', color: '#999' },
      }),
      Placeholder.configure({ placeholder: 'Comece a escrever...' }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-zinc max-w-none min-h-full px-6 py-8 focus:outline-none sm:px-10 sm:py-12 lg:px-16',
      },
    },
  })

  if (!editor) return null

  return (
    <div className="flex h-full flex-col">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:px-10 lg:pb-14">
          <div className="paper-sheet motion-rise w-full overflow-hidden rounded-[28px] sm:rounded-[34px]">
            <EditorContent editor={editor} className="h-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
