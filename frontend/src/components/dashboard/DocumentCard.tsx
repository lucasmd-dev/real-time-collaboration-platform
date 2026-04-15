import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Document } from '@/types'
import { formatDate } from '@/lib/utils'
import { useDocumentStore } from '@/store/documentStore'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'

interface DocumentCardProps {
  doc: Document
}

export function DocumentCard({ doc }: DocumentCardProps) {
  const navigate = useNavigate()
  const { rename, remove } = useDocumentStore()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(doc.title)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const isOwner = doc.role === 'owner'

  const handleRename = async () => {
    if (title.trim() && title !== doc.title) {
      await rename(doc.id, title.trim())
    }
    setEditing(false)
  }

  const handleDelete = async () => {
    setMenuOpen(false)
    try {
      await remove(doc.id)
      setConfirmDeleteOpen(false)
      toast.success('Documento excluído')
    } catch {
      toast.error('Não foi possível excluir o documento')
    }
  }

  useEffect(() => {
    if (!menuOpen || !menuButtonRef.current) {
      return
    }

    const updatePosition = () => {
      const rect = menuButtonRef.current?.getBoundingClientRect()
      if (!rect) {
        return
      }

      setMenuPosition({
        top: rect.bottom + 8,
        left: Math.min(window.innerWidth - 176, Math.max(16, rect.right - 160)),
      })
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        menuRef.current?.contains(target) ||
        menuButtonRef.current?.contains(target)
      ) {
        return
      }

      setMenuOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  return (
    <div className="group relative px-6 py-5 transition-colors duration-200 hover:bg-[rgba(255,255,255,0.42)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1" onClick={() => !editing && navigate(`/editor/${doc.id}`)}>
          {editing ? (
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setEditing(false)
              }}
              onClick={e => e.stopPropagation()}
              className="w-full border-b border-stone-300 bg-transparent pb-1 text-lg font-semibold tracking-[-0.03em] text-zinc-950 focus:border-sky-900 focus:outline-none"
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-semibold tracking-[-0.03em] text-zinc-950 transition-colors group-hover:text-sky-900">
                  {doc.title}
                </h3>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${isOwner ? 'bg-stone-100 text-zinc-600' : 'bg-sky-100 text-sky-900'}`}>
                  {isOwner ? 'Dono' : 'Compartilhado'}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">
                Atualizado {formatDate(doc.updatedAt)}
                <span className="mx-2 text-stone-300">•</span>
                {doc.activeCollaborators > 0
                  ? `${doc.activeCollaborators} colaborando agora`
                  : 'Sem colaboradores ativos'}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Criado {formatDate(doc.createdAt)}</p>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 self-start lg:self-center">
          <button
            onClick={() => !editing && navigate(`/editor/${doc.id}`)}
            className="text-sm font-semibold text-zinc-700 transition-colors hover:text-sky-900"
          >
            Abrir
          </button>

          {isOwner && (
            <div className="relative">
              <button
                ref={menuButtonRef}
                onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-white/45 text-zinc-500 transition-all hover:border-stone-200 hover:bg-white hover:text-zinc-800"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {menuOpen && menuPosition && createPortal(
        <div
          ref={menuRef}
          className="surface-panel fixed z-50 w-40 rounded-2xl p-1.5"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <button
            onClick={() => { setMenuOpen(false); setEditing(true) }}
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-white"
          >
            Renomear
          </button>
          <button
            onClick={() => { setMenuOpen(false); setConfirmDeleteOpen(true) }}
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
          >
            Excluir
          </button>
        </div>,
        document.body,
      )}

      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Excluir documento"
      >
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          Essa ação remove <strong className="text-zinc-900">{doc.title}</strong> de forma permanente.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  )
}
