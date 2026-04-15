export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function formatDate(value: string | Date | null | undefined) {
  const date = value instanceof Date ? value : value ? new Date(value) : null

  if (!date || Number.isNaN(date.getTime())) {
    return 'Data indisponível'
  }

  return dateFormatter.format(date)
}

export function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}
