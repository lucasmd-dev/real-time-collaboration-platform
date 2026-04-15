import { ReactNode } from 'react'
import { Navigate, createBrowserRouter, isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from '@/pages/AuthLayout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { EditorPage } from '@/pages/EditorPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function RequireGuest({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  const description = isRouteErrorResponse(error)
    ? error.statusText || 'Não foi possível carregar esta rota.'
    : error instanceof Error
      ? error.message
      : 'Ocorreu um erro inesperado.'

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">Algo saiu do esperado</h1>
        <p className="mt-2 text-sm text-zinc-600">{description}</p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            Ir para o dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace />, errorElement: <RouteErrorBoundary /> },
  {
    element: <RequireGuest><AuthLayout /></RequireGuest>,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: '/dashboard',
    element: <RequireAuth><DashboardPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/editor/:id',
    element: <RequireAuth><EditorPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
])
