import { Outlet, useLocation } from 'react-router-dom'
import { AuthShell } from '@/components/auth/AuthShell'
import { useAuthContent } from '@/components/auth/authContent'

export function AuthLayout() {
  const location = useLocation()
  const { title, description, footer } = useAuthContent()

  return (
    <AuthShell
      title={title}
      description={description}
      footer={footer}
      transitionKey={location.pathname}
    >
      <Outlet />
    </AuthShell>
  )
}
