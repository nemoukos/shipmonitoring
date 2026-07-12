'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/components/AuthProvider'
import { apiFetch } from '@/lib/clientApi'
import type {
  DashboardData,
  MeasurementThreshold,
  ShipMeasurement,
} from '@/types/dashboard'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const chartColors = {
  speed: '#38bdf8',
  fuel: '#34d399',
  temperature: '#f97316',
}

const gridColor = 'rgba(148, 163, 184, 0.18)'
const tickColor = '#94a3b8'

function displayDate(value: string) {
  return new Intl.DateTimeFormat('el-GR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function metricThreshold(
  thresholds: MeasurementThreshold[],
  metric: string
) {
  return thresholds.find((threshold) => threshold.metric === metric)
}

function measurementLabel(
  measurement: ShipMeasurement,
  thresholds: MeasurementThreshold[]
) {
  return metricThreshold(thresholds, measurement.metric)?.label ?? measurement.metric
}

function measurementUnit(
  measurement: ShipMeasurement,
  thresholds: MeasurementThreshold[]
) {
  return metricThreshold(thresholds, measurement.metric)?.unit ?? ''
}

function chartDataset(
  measurements: ShipMeasurement[],
  thresholds: MeasurementThreshold[],
  metric: string
) {
  const metricMeasurements = measurements.filter((item) => item.metric === metric)
  const threshold = metricThreshold(thresholds, metric)

  return {
    labels: metricMeasurements.map((item) => displayDate(item.measured_at)),
    datasets: [
      {
        label: `${threshold?.label ?? metric} (${threshold?.unit ?? ''})`,
        data: metricMeasurements.map((item) => item.value),
        borderColor: chartColors[metric as keyof typeof chartColors] ?? '#a78bfa',
        backgroundColor: chartColors[metric as keyof typeof chartColors] ?? '#a78bfa',
        pointBackgroundColor: metricMeasurements.map((item) =>
          item.status === 'alert' ? '#ef4444' : '#22c55e'
        ),
        tension: 0.35,
      },
    ],
  }
}

function chartOptions(threshold?: MeasurementThreshold) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: tickColor,
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: tickColor },
        suggestedMin: threshold ? threshold.min_value - 5 : undefined,
        suggestedMax: threshold ? threshold.max_value + 5 : undefined,
      },
    },
  }
}

function StatusCard({
  measurement,
  thresholds,
}: {
  measurement: ShipMeasurement
  thresholds: MeasurementThreshold[]
}) {
  const threshold = metricThreshold(thresholds, measurement.metric)
  const unit = measurementUnit(measurement, thresholds)
  const isAlert = measurement.status === 'alert'

  return (
    <div
      className={`rounded-lg border p-4 shadow-xl ${
        isAlert
          ? 'border-red-400/40 bg-red-950/35'
          : 'border-emerald-400/35 bg-emerald-950/25'
      }`}
    >
      <p className="text-sm text-slate-300">
        {measurementLabel(measurement, thresholds)}
      </p>

      <p className={`mt-2 text-3xl font-bold ${isAlert ? 'text-red-200' : 'text-emerald-200'}`}>
        {measurement.value}
        <span className="ml-1 text-base">{unit}</span>
      </p>

      {threshold && (
        <p className="mt-3 text-xs text-slate-400">
          Limit {threshold.min_value} - {threshold.max_value} {unit}
        </p>
      )}
    </div>
  )
}

function ChartCard({
  metric,
  data,
}: {
  metric: string
  data: DashboardData
}) {
  const threshold = metricThreshold(data.thresholds, metric)

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl">
      <h2 className="text-lg font-bold">{threshold?.label ?? metric}</h2>

      <div className="mt-4 h-72">
        <Line
          data={chartDataset(data.measurements, data.thresholds, metric)}
          options={chartOptions(threshold)}
        />
      </div>
    </section>
  )
}

export default function ShipCharts() {
  const { token } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [selectedShipId, setSelectedShipId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      return
    }

    const authToken = token

    async function loadDashboard() {
      setIsLoading(true)
      setError('')

      const query = selectedShipId ? `?shipId=${selectedShipId}` : ''
      const response = await apiFetch(`/api/dashboard${query}`, authToken)

      if (response.status === 401) {
        router.replace('/login?next=/dashboard')
        return
      }

      if (!response.ok) {
        setError('Unable to load dashboard data.')
        setIsLoading(false)
        return
      }

      const nextData = (await response.json()) as DashboardData

      setData(nextData)
      setSelectedShipId(nextData.selectedShip?.id ?? null)
      setIsLoading(false)
    }

    void loadDashboard()
  }, [router, selectedShipId, token])

  const metrics = useMemo(
    () => data?.thresholds.map((threshold) => threshold.metric) ?? [],
    [data]
  )

  if (isLoading && !data) {
    return (
      <div className="grid min-h-[calc(100vh-73px)] place-items-center px-4">
        <p className="text-sm text-[var(--muted)]">Loading dashboard...</p>
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

  if (!data || !data.selectedShip) {
    return null
  }

  return (
    <div className="grid gap-6 p-6">
      <section className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Measurements for {data.selectedShip.name}
          </p>
        </div>

        <label className="grid gap-2 text-sm font-medium">
          Ship
          <select
            value={selectedShipId ?? ''}
            onChange={(event) => setSelectedShipId(Number(event.target.value))}
            className="h-11 min-w-64 rounded-md border border-[var(--border)] bg-slate-950 px-3 text-white outline-none transition focus:border-cyan-300"
          >
            {data.ships.map((ship) => (
              <option key={ship.id} value={ship.id}>
                {ship.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {data.latestMeasurements.map((measurement) => (
          <StatusCard
            key={measurement.id}
            measurement={measurement}
            thresholds={data.thresholds}
          />
        ))}
      </section>

      {data.alerts.length > 0 && (
        <section className="rounded-lg border border-red-400/30 bg-red-950/25 p-4 shadow-xl">
          <h2 className="text-lg font-bold text-red-100">Active alerts</h2>
          <div className="mt-3 grid gap-2">
            {data.alerts.slice(0, 5).map((alert) => (
              <p key={alert.id} className="text-sm text-red-100">
                {alert.label}: {alert.value} {alert.unit} outside {alert.min_value} -{' '}
                {alert.max_value} on {displayDate(alert.measured_at)}
              </p>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        {metrics.map((metric) => (
          <ChartCard key={metric} metric={metric} data={data} />
        ))}
      </section>
    </div>
  )
}
