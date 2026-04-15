import { ReactNode } from 'react'

interface AuthShellProps {
  title: string
  description: string
  footer: ReactNode
  transitionKey: string
  children: ReactNode
}

const signals = [
  'Presença ao vivo',
  'Rascunho sincronizado',
  'Compartilhamento direto',
]

export function AuthShell({ title, description, footer, transitionKey, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96),transparent_24%),linear-gradient(135deg,rgba(210,222,228,0.32),transparent_38%),linear-gradient(180deg,#f6f1e8_0%,#ede4d6_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.24)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.24)_1px,transparent_1px)] bg-[size:88px_88px] opacity-[0.16]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1460px] flex-col gap-10 px-5 py-6 sm:px-8 sm:py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-16 lg:px-10 lg:py-10">
        <section className="flex flex-col justify-center lg:min-h-[calc(100vh-5rem)]">
          <div className="motion-rise max-w-[780px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Colaboração em tempo real</p>
            <p className="mt-3 font-sans text-[clamp(4.5rem,10vw,7rem)] font-[800] leading-[0.82] tracking-[-0.09em] text-zinc-950">
              Collab
            </p>
            <h1 className="mt-6 max-w-[720px] font-display text-[clamp(2.3rem,4.2vw,3.7rem)] leading-[0.92] tracking-[-0.05em] text-zinc-900">
              Escrita compartilhada com presença e contexto.
            </h1>
            <p className="mt-4 max-w-[560px] text-sm leading-7 text-zinc-600 sm:text-base">
              Entre na sessão, retome o documento certo e continue de onde a equipe parou.
            </p>
          </div>

          <div className="motion-rise motion-delay-1 mt-10 max-w-[760px]">
            <div className="paper-sheet overflow-hidden rounded-[34px]">
              <div className="flex items-center justify-between border-b border-stone-200/75 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 sm:px-8">
                <span>Sessão ativa</span>
                <span className="flex items-center gap-2 text-sky-900">
                  <span className="h-2 w-2 rounded-full bg-sky-800" />
                  Ao vivo
                </span>
              </div>

              <div className="grid gap-8 px-6 py-7 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_200px]">
                <div>
                  <div className="h-3 w-28 rounded-full bg-stone-200" />
                  <div className="mt-7 h-4 w-[78%] rounded-full bg-zinc-800/85" />
                  <div className="mt-4 h-3 w-[94%] rounded-full bg-stone-200" />
                  <div className="mt-3 h-3 w-[84%] rounded-full bg-stone-200" />
                  <div className="mt-8 flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-900 text-xs font-semibold text-white">LU</span>
                    <div className="flex-1 space-y-3">
                      <div className="h-3 w-32 rounded-full bg-stone-200" />
                      <div className="h-3 w-48 max-w-full rounded-full bg-stone-100" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between border-t border-stone-200/75 pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Status</p>
                    <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-zinc-950">Rascunho sincronizado</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-600">
                      O documento permanece alinhado entre quem está escrevendo agora.
                    </p>
                  </div>
                  <div className="mt-6 inline-flex w-fit rounded-full bg-sky-900 px-3 py-1.5 text-xs font-semibold text-white">
                    2 pessoas ativas
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="motion-rise motion-delay-2 mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {signals.map(signal => (
              <span key={signal} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-800" />
                {signal}
              </span>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center lg:justify-end">
          <div className="surface-panel motion-rise motion-delay-2 w-full max-w-md rounded-[30px] p-6 sm:p-8">
            <div key={transitionKey} className="auth-panel-transition auth-panel-viewport">
              <div className="border-b border-stone-200/80 pb-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Acesso à plataforma</p>
                <h2 className="mt-4 text-[2rem] font-semibold tracking-[-0.05em] text-zinc-950">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{description}</p>
              </div>
              <div className="mt-6">{children}</div>
              <div className="mt-6 border-t border-stone-200/80 pt-5 text-sm text-zinc-500">
                {footer}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
