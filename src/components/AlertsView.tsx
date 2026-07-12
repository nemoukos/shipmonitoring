'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { apiFetch } from '@/lib/clientApi'
import type { ShipAlert } from '@/types/dashboard'

function displayDate(value: string) {
  return new Intl.DateTimeFormat('el-GR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function thresholdState(alert: ShipAlert) {
  if (alert.value < alert.min_value) {
    return 'below'
  }

  if (alert.value > alert.max_value) {
    return 'above'
  }

  return 'inside'
}

function thresholdBarColor(state: 'below' | 'inside' | 'above') {
  if (state === 'below') {
    return 'bg-sky-400'
  }

  if (state === 'above') {
    return 'bg-red-400'
  }

  return 'bg-emerald-400'
}

function thresholdMarkerPosition(alert: ShipAlert) {
  const minDomain = Math.min(alert.value, alert.min_value)
  const maxDomain = Math.max(alert.value, alert.max_value)
  const range = maxDomain - minDomain

  if (range <= 0) {
    return 0
  }

  return ((alert.value - minDomain) / range) * 100
}

function limitPosition(value: number, alert: ShipAlert) {
  const minDomain = Math.min(alert.value, alert.min_value)
  const maxDomain = Math.max(alert.value, alert.max_value)
  const range = maxDomain - minDomain

  if (range <= 0) {
    return 0
  }

  return ((value - minDomain) / range) * 100
}

function LimitBar({ alert }: { alert: ShipAlert }) {
  const state = thresholdState(alert)
  const markerPosition = thresholdMarkerPosition(alert)
  const minPosition = limitPosition(alert.min_value, alert)
  const maxPosition = limitPosition(alert.max_value, alert)
  const outOfRangeColor = thresholdBarColor(state)

  return (
    <div className="grid gap-2">
      <div className="relative h-6">
        <div className="absolute inset-0 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`absolute inset-y-0 left-0 ${outOfRangeColor}`}
            style={{ width: `${minPosition}%` }}
          />
          <div
            className="absolute inset-y-0 bg-emerald-400"
            style={{
              left: `${minPosition}%`,
              width: `${maxPosition - minPosition}%`,
            }}
          />
          <div
            className={`absolute inset-y-0 right-0 ${outOfRangeColor}`}
            style={{ width: `${100 - maxPosition}%` }}
          />
        </div>
        <span
          className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-slate-950/70 px-1 text-[11px] font-semibold text-white"
          style={{ left: `${minPosition}%` }}
        >
          {alert.min_value} {alert.unit}
        </span>
        <span
          className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-slate-950/70 px-1 text-[11px] font-semibold text-white"
          style={{ left: `${maxPosition}%` }}
        >
          {alert.max_value} {alert.unit}
        </span>
        <span
          className="absolute top-1/2 z-20 h-7 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
          style={{ left: `${markerPosition}%` }}
        />
      </div>

      <p className="text-xs text-slate-400">
        Value: {alert.value} {alert.unit}
      </p>
    </div>
  )
}

export default function AlertsView() {
  const { token } = useAuth()
  const router = useRouter()
  const [alerts, setAlerts] = useState<ShipAlert[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      return
    }

    const authToken = token

    async function loadAlerts() {
      const response = await apiFetch('/api/alerts', authToken)

      if (response.status === 401) {
        router.replace('/login?next=/alerts')
        return
      }

      if (!response.ok) {
        setError('Unable to load alerts.')
        setIsLoading(false)
        return
      }

      const data = (await response.json()) as { alerts: ShipAlert[] }

      setAlerts(data.alerts)
      setIsLoading(false)
    }

    void loadAlerts()
  }, [router, token])

  if (isLoading) {
    return (
      <div className="grid min-h-[calc(100vh-73px)] place-items-center px-4">
        <p className="text-sm text-[var(--muted)]">Loading alerts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid min-h-[calc(100vh-73px)] place-items-center px-4">
        <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-4 py-3 text-red-100">
          {error}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 p-6">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl">
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Values appear here when they move outside their configured thresholds.
        </p>
      </section>

      {alerts.length === 0 ? (
        <section className="rounded-lg border border-emerald-400/30 bg-emerald-950/25 p-4 text-emerald-100 shadow-xl">
          No active threshold alerts.
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-xl">
          <div className="grid grid-cols-[1.3fr_1fr_0.8fr_1fr_1fr] gap-4 border-b border-[var(--border)] px-4 py-3 text-xs font-semibold uppercase text-slate-400">
            <span>Ship</span>
            <span>Measurement</span>
            <span>Value</span>
            <span>Limit</span>
            <span>Time</span>
          </div>

          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="grid grid-cols-[1.3fr_1fr_0.8fr_1fr_1fr] gap-4 border-b border-[var(--border)] px-4 py-3 text-sm last:border-b-0"
            >
              <span className="font-semibold text-white">{alert.ship_name}</span>
              <span>{alert.label}</span>
              <span className="font-bold text-red-200">
                {alert.value} {alert.unit}
              </span>
              <LimitBar alert={alert} />
              <span className="text-slate-300">{displayDate(alert.measured_at)}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
