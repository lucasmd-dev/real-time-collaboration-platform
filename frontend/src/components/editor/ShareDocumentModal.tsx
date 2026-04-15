import { FormEvent, useEffect, useState } from 'react'
import axios from 'axios'
import api from '@/services/api'
import { Collaborator } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface ShareDocumentModalProps {
  documentId: string
  open: boolean
  onClose: () => void
}

export function ShareDocumentModal({ documentId, open, onClose }: ShareDocumentModalProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadCollaborators() {
      setLoading(true)
      try {
        const { data } = await api.get(`/documents/${documentId}/collaborators`)
        if (!cancelled) {
          setCollaborators(data)
        }
      } catch {
        if (!cancelled) {
          toast.error('Não foi possível carregar os colaboradores')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCollaborators()

    return () => {
      cancelled = true
    }
  }, [documentId, open])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copiado')
    } catch {
      toast.error('Não foi possível copiar o link')
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const { data } = await api.post(`/documents/${documentId}/collaborators`, { email })
      setCollaborators(data)
      setEmail('')
      toast.success('Colaborador adicionado')
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message || 'Não foi possível compartilhar o documento'
        : 'Não foi possível compartilhar o documento'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (userId: string) => {
    try {
      const { data } = await api.delete(`/documents/${documentId}/collaborators/${userId}`)
      setCollaborators(data)
      toast.success('Colaborador removido')
    } catch {
      toast.error('Não foi possível remover o colaborador')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Compartilhar documento">
      <div className="space-y-6">
        <div className="rounded-[24px] border border-stone-200/80 bg-white/65 px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Link do documento</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">Compartilhe com quem já tem conta na plataforma.</p>
          </div>
          <div className="mt-4">
            <Button variant="ghost" size="sm" onClick={handleCopyLink}>
              Copiar link do documento
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Convidar por e-mail"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="colaborador@exemplo.com"
            required
            className="flex-1"
          />
          <Button type="submit" loading={submitting}>
            Convidar
          </Button>
        </form>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Pessoas com acesso</h3>
          <div className="mt-3 space-y-2">
            {loading && <p className="text-sm text-zinc-500">Carregando...</p>}
            {!loading && collaborators.length === 0 && (
              <p className="text-sm text-zinc-500">Nenhum colaborador adicionado ainda.</p>
            )}
            {!loading && collaborators.map(collaborator => (
              <div
                key={collaborator.id}
                className="flex items-center justify-between gap-3 rounded-[20px] border border-stone-200/80 bg-white/55 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">{collaborator.name}</p>
                  <p className="truncate text-xs text-zinc-500">{collaborator.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${collaborator.role === 'owner' ? 'bg-stone-100 text-zinc-600' : 'bg-sky-100 text-sky-900'}`}>
                    {collaborator.role === 'owner' ? 'Dono' : 'Editor'}
                  </span>
                  {collaborator.role !== 'owner' && (
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(collaborator.id)}>
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
