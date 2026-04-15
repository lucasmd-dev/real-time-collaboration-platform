import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useCollaboration } from '@/hooks/useCollaboration'
import { useDocumentStore } from '@/store/documentStore'
import { CollaborativeEditor } from '@/components/editor/CollaborativeEditor'
import { ShareDocumentModal } from '@/components/editor/ShareDocumentModal'
import { AvatarList } from '@/components/presence/AvatarList'
import { Button } from '@/components/ui/Button'
import { getSocket } from '@/services/socket'
import { SaveStatus } from '@/types'
import api from '@/services/api'
import toast from 'react-hot-toast'

const saveStatusLabel: Record<SaveStatus, string> = {
  saved: 'Salvo',
  saving: 'Salvando...',
  offline: 'Offline',
  error: 'Erro ao salvar',
}

const saveStatusColor: Record<SaveStatus, string> = {
  saved: 'text-zinc-400',
  saving: 'text-zinc-400',
  offline: 'text-amber-500',
  error: 'text-red-500',
}

export function EditorPage() {
  const { id: documentId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { accessToken, user } = useAuthStore()
  const { rename } = useDocumentStore()
  const [title, setTitle] = useState('Sem título')
  const [editingTitle, setEditingTitle] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [loadingDocument, setLoadingDocument] = useState(true)
  const titleRef = useRef<HTMLInputElement>(null)

  const socket = getSocket(accessToken!)
  const { ydoc, provider, users, connectionStatus, saveStatus } = useCollaboration(documentId!, socket)
  const canEditTitle = user?.id === ownerId

  const handleTitleBlur = async () => {
    const nextTitle = title.trim() || 'Sem título'

    setEditingTitle(false)
    setTitle(nextTitle)

    if (!canEditTitle) {
      return
    }

    try {
      await rename(documentId!, nextTitle)
    } catch {
      toast.error('Falha ao renomear')
    }
  }

  useEffect(() => {
    if (editingTitle) titleRef.current?.focus()
  }, [editingTitle])

  useEffect(() => {
    let cancelled = false

    async function loadDocument() {
      if (!documentId) return

      setLoadingDocument(true)

      try {
        const { data } = await api.get(`/documents/${documentId}`)
        if (cancelled) return

        setTitle(data.title)
        setOwnerId(data.ownerId ?? null)
      } catch {
        if (!cancelled) {
          toast.error('Não foi possível carregar o documento')
          navigate('/dashboard')
        }
      } finally {
        if (!cancelled) {
          setLoadingDocument(false)
        }
      }
    }

    loadDocument()

    return () => {
      cancelled = true
    }
  }, [documentId, navigate])

  useEffect(() => {
    const handleAccessRevoked = ({ documentId: revokedDocumentId }: { documentId: string }) => {
      if (revokedDocumentId !== documentId) return
      toast.error('Seu acesso a este documento foi removido')
      navigate('/dashboard')
    }

    socket.on('document:access_revoked', handleAccessRevoked)

    return () => {
      socket.off('document:access_revoked', handleAccessRevoked)
    }
  }, [documentId, navigate, socket])

  if (!provider || !ydoc || loadingDocument) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="motion-rise flex items-center gap-3 text-zinc-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm">Conectando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.82),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.24),transparent_28%),linear-gradient(180deg,#f6f1e8_0%,#efe7dc_100%)]" />

      <header className="relative z-10 shrink-0 border-b border-stone-200/80 bg-[rgba(246,241,232,0.78)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="hidden sm:block">
              <p className="font-display text-3xl leading-none tracking-[-0.05em] text-zinc-950">Collab</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Editor</p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent bg-white/40 text-zinc-500 transition-all hover:border-stone-200 hover:bg-white hover:text-zinc-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="hidden h-10 w-px bg-stone-200 sm:block" />

            <div className="min-w-0">
              {editingTitle && canEditTitle ? (
                <input
                  ref={titleRef}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={e => { if (e.key === 'Enter') titleRef.current?.blur() }}
                  className="min-w-0 border-b border-stone-300 bg-transparent text-lg font-semibold tracking-[-0.03em] text-zinc-950 focus:border-sky-900 focus:outline-none"
                />
              ) : (
                <h1
                  onClick={() => canEditTitle && setEditingTitle(true)}
                  className={`truncate text-lg font-semibold tracking-[-0.03em] ${canEditTitle ? 'cursor-pointer text-zinc-950 transition-colors hover:text-sky-900' : 'text-zinc-900'}`}
                >
                  {title}
                </h1>
              )}

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className={saveStatusColor[saveStatus]}>{saveStatusLabel[saveStatus]}</span>
                <span className="text-stone-300">•</span>
                <span>{canEditTitle ? 'Acesso do dono' : 'Acesso compartilhado'}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {connectionStatus === 'offline' && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Offline</span>
            )}

            <AvatarList users={users} />

            {canEditTitle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareModal(true)}
                title="Compartilhar documento"
                className="hidden sm:inline-flex"
              >
                Compartilhar
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-0 flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <CollaborativeEditor provider={provider} />
        </div>
      </div>

      {canEditTitle && (
        <ShareDocumentModal
          documentId={documentId!}
          open={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
