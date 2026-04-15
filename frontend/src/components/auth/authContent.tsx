import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface AuthContent {
  title: string
  description: string
  footer: ReactNode
}

const contentByPath: Record<string, AuthContent> = {
  '/login': {
    title: 'Entrar',
    description: 'Acesse seus documentos, recupere o contexto da equipe e continue editando sem interrupções.',
    footer: (
      <p>
        Não tem conta?{' '}
        <Link
          to="/register"
          viewTransition
          className="font-semibold text-zinc-900 transition-colors hover:text-sky-900"
        >
          Criar conta
        </Link>
      </p>
    ),
  },
  '/register': {
    title: 'Criar conta',
    description: 'Crie seu espaço, convide colaboradores e mantenha cada documento sincronizado desde o primeiro rascunho.',
    footer: (
      <p>
        Já tem conta?{' '}
        <Link
          to="/login"
          viewTransition
          className="font-semibold text-zinc-900 transition-colors hover:text-sky-900"
        >
          Entrar
        </Link>
      </p>
    ),
  },
}

export function useAuthContent() {
  const location = useLocation()
  return contentByPath[location.pathname] ?? contentByPath['/login']
}
