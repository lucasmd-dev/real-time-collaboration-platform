import { useState, FormEvent } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore(s => s.register)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(email, name, password)
      navigate('/dashboard')
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error?.message || 'Falha ao criar conta'
        : 'Falha ao criar conta'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nome"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Seu nome"
        required
        autoFocus
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="voce@exemplo.com"
        required
      />
      <Input
        label="Senha"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Mínimo 8 caracteres"
        minLength={8}
        required
      />
      <Button type="submit" loading={loading} className="mt-2 w-full">
        Criar conta
      </Button>
    </form>
  )
}
