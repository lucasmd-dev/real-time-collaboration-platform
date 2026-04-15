import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentStore } from '@/store/documentStore'
import { useAuthStore } from '@/store/authStore'
import { DocumentCard } from '@/components/dashboard/DocumentCard'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { documents, loading, fetch, create } = useDocumentStore()

  useEffect(() => { fetch() }, [fetch])

  const handleCreate = async () => {
    try {
      const doc = await create()
      navigate(`/editor/${doc.id}`)
    } catch {
      toast.error('Falha ao criar documento')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[rgba(246,241,232,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="font-display text-4xl leading-none tracking-[-0.05em] text-zinc-950">Collab</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Workspace</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-zinc-800">{user?.name}</p>
              <p className="text-xs text-zinc-500">Documentos e presença ao vivo</p>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>Sair</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <section className="motion-rise">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Documentos</p>
              <h1 className="mt-3 font-display text-4xl leading-[0.95] tracking-[-0.05em] text-zinc-950 sm:text-5xl">
                Seu espaço de trabalho em tempo real.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 sm:text-base">
                Abra, retome ou compartilhe um documento sem sair do fluxo. A lista abaixo reflete o que está disponível para você agora.
              </p>
            </div>

            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo documento
            </Button>
          </div>
        </section>

        <section className="surface-panel motion-rise motion-delay-1 mt-10 overflow-hidden rounded-[32px]">
          <div className="flex flex-col gap-2 border-b border-stone-200/80 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-[-0.02em] text-zinc-900">Documentos disponíveis</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-500">Acesse documentos próprios e compartilhados com indicadores de atividade ao vivo.</p>
            </div>
            {!loading && (
              <p className="text-xs font-medium text-zinc-500">
                {documents.length} {documents.length === 1 ? 'documento' : 'documentos'}
              </p>
            )}
          </div>

          {loading && (
            <div className="divide-y divide-stone-200/80">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-5">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 w-44 rounded-full bg-stone-200" />
                    <div className="h-3 w-72 max-w-full rounded-full bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && documents.length === 0 && (
            <div className="px-6 py-20 text-center">
              <p className="text-sm font-medium text-zinc-700">Nenhum documento disponível ainda.</p>
              <p className="mt-2 text-sm text-zinc-500">Crie o primeiro rascunho para começar a colaborar.</p>
              <Button onClick={handleCreate} variant="ghost" className="mt-6">
                Criar primeiro documento
              </Button>
            </div>
          )}

          {!loading && documents.length > 0 && (
            <div className="divide-y divide-stone-200/80">
              {documents.map(doc => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
