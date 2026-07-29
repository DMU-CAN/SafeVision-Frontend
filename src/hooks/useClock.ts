import { useEffect, useState } from 'react'

function formatDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function useClock() {
  const [now, setNow] = useState(() => formatDate(new Date()))

  useEffect(() => {
    const timer = window.setInterval(() => setNow(formatDate(new Date())), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return now
}
