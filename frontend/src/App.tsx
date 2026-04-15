import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { router } from './router'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 252, 246, 0.96)',
            color: '#181412',
            border: '1px solid rgba(194, 183, 169, 0.72)',
            borderRadius: '18px',
            boxShadow: '0 32px 80px -48px rgba(28, 19, 12, 0.8)',
          },
        }}
      />
    </>
  )
}
