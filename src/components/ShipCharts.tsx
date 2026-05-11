'use client'

import type { ReactNode } from 'react'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import {
  Bar,
  Line,
} from 'react-chartjs-2'

import ships from '@/data/ships.json'
import type { Ship } from '@/types/ship'

// Registers the Chart.js modules required by the chart components below.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

type ChartCardProps = {
  title: string
  children: ReactNode
}

type YAxisOptions = {
  title: string
  beginAtZero?: boolean
  min?: number
  max?: number
}

const typedShips = ships as Ship[]
const shipNames = typedShips.map((ship) => ship.name)
const readingLabels = ['08:00', '11:00', '14:00', '17:00', '20:00']

// Reusable colors for ship datasets across all charts.
const colors = [
  '#22d3ee',
  '#38bdf8',
  '#a78bfa',
  '#f59e0b',
  '#34d399',
]

const gridColor = 'rgba(148, 163, 184, 0.18)'
const tickColor = '#94a3b8'

// Shared visual options used to keep all charts consistent.
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: tickColor,
        boxWidth: 12,
        boxHeight: 12,
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: gridColor,
      },
      ticks: {
        color: tickColor,
      },
    },
    y: {
      grid: {
        color: gridColor,
      },
      ticks: {
        color: tickColor,
      },
    },
  },
}

// Returns the most recent value from a ship metric history.
function latestValue(values: number[]) {
  return values[values.length - 1]
}

// Adds the y-axis label and limits needed by each chart.
function chartOptions({
  title,
  beginAtZero,
  min,
  max,
}: YAxisOptions) {
  return {
    ...baseOptions,
    scales: {
      ...baseOptions.scales,
      y: {
        ...baseOptions.scales.y,
        beginAtZero,
        min,
        max,
        title: {
          display: true,
          text: title,
          color: tickColor,
        },
      },
    },
  }
}

// Creates one bar dataset from the latest value of a ship metric.
function latestMetricDataset(
  label: string,
  getValues: (ship: Ship) => number[]
) {
  return {
    labels: shipNames,
    datasets: [
      {
        label,
        data: typedShips.map((ship) => latestValue(getValues(ship))),
        backgroundColor: colors,
        borderRadius: 6,
      },
    ],
  }
}

// Creates one line per ship for a metric measured throughout the day.
function trendDataset(getValues: (ship: Ship) => number[]) {
  return {
    labels: readingLabels,
    datasets: typedShips.map((ship, index) => ({
      label: ship.name,
      data: getValues(ship),
      borderColor: colors[index],
      backgroundColor: colors[index],
      tension: 0.35,
    })),
  }
}

// Wraps every chart in the same styled dashboard card.
function ChartCard({
  title,
  children,
}: ChartCardProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl">
      <h2 className="mb-4 text-xl font-bold">
        {title}
      </h2>

      <div className="h-[320px]">
        {children}
      </div>
    </div>
  )
}

// Renders the dashboard charts for speed, fuel, and temperature.
export default function ShipCharts() {
  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
      <ChartCard title="Current Speed">
        <Bar
          data={latestMetricDataset('Knots', (ship) => ship.speed)}
          options={chartOptions({
            title: 'knots',
            beginAtZero: true,
          })}
        />
      </ChartCard>

      <ChartCard title="Current Fuel Level">
        <Bar
          data={latestMetricDataset('Fuel %', (ship) => ship.fuel)}
          options={chartOptions({
            title: '%',
            beginAtZero: true,
            max: 100,
          })}
        />
      </ChartCard>

      <ChartCard title="Fuel Trend">
        <Line
          data={trendDataset((ship) => ship.fuel)}
          options={chartOptions({
            title: '%',
            min: 0,
            max: 100,
          })}
        />
      </ChartCard>

      <ChartCard title="Temperature Trend">
        <Line
          data={trendDataset((ship) => ship.temperature)}
          options={chartOptions({
            title: 'Celsius',
          })}
        />
      </ChartCard>
    </div>
  )
}
