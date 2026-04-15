import { describe, expect, it, vi, beforeEach } from 'vitest'

const useEditorMock = vi.fn()
const editorContentMock = vi.fn(() => null)
const starterKitConfigureMock = vi.fn(() => ({ name: 'starter-kit' }))
const collaborationConfigureMock = vi.fn(() => ({ name: 'collaboration' }))
const collaborationCursorConfigureMock = vi.fn(() => ({ name: 'collaboration-cursor' }))
const placeholderConfigureMock = vi.fn(() => ({ name: 'placeholder' }))

vi.mock('@tiptap/react', () => ({
  useEditor: useEditorMock,
  EditorContent: editorContentMock,
}))

vi.mock('@tiptap/starter-kit', () => ({
  default: { configure: starterKitConfigureMock },
}))

vi.mock('@tiptap/extension-collaboration', () => ({
  default: { configure: collaborationConfigureMock },
}))

vi.mock('@tiptap/extension-collaboration-cursor', () => ({
  default: { configure: collaborationCursorConfigureMock },
}))

vi.mock('@tiptap/extension-placeholder', () => ({
  default: { configure: placeholderConfigureMock },
}))

vi.mock('./EditorToolbar', () => ({
  EditorToolbar: () => null,
}))

describe('CollaborativeEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEditorMock.mockReturnValue({ id: 'editor' })
  })

  it('passes the collaboration provider to the cursor extension', async () => {
    const localUser = { name: 'Lucas', color: '#123456' }
    const provider = {
      doc: { id: 'doc' },
      awareness: {
        getLocalState: () => ({ user: localUser }),
      },
    }

    const { CollaborativeEditor } = await import('./CollaborativeEditor')
    CollaborativeEditor({ provider } as never)

    expect(collaborationCursorConfigureMock).toHaveBeenCalledWith({
      provider,
      user: localUser,
    })
  })
})
