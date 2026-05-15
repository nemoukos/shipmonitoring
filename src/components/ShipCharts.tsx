'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
const defaultStartDate = '2026-05-01'
const defaultEndDate = '2026-05-25'
const dayInMs = 24 * 60 * 60 * 1000
const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const monthLabels = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Reusable colors for ship datasets across all charts.
const colors = [
  '#22d3ee',
  '#38bdf8',
  '#a78bfa',
  '#f59e0b',
  '#34d399',
  '#fb7185',
  '#60a5fa',
  '#facc15',
  '#c084fc',
  '#2dd4bf',
]
const marketColors = ['#f97316', '#eab308', '#14b8a6', '#f43f5e']

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

function dateFromInput(value: string) {
  return new Date(`${value}T00:00:00Z`)
}

function inputFromDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function monthStartFromInput(value: string) {
  const date = dateFromInput(value)

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function addMonths(date: Date, months: number) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1)
  )
}

function calendarDatesForMonth(monthDate: Date) {
  const year = monthDate.getUTCFullYear()
  const month = monthDate.getUTCMonth()
  const firstDay = new Date(Date.UTC(year, month, 1))
  const leadingDays = (firstDay.getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  return [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) =>
      inputFromDate(new Date(Date.UTC(year, month, index + 1)))
    ),
  ]
}

function datesInRange(start: string, end: string) {
  const startTime = dateFromInput(start).getTime()
  const endTime = dateFromInput(end).getTime()
  const from = Math.min(startTime, endTime)
  const to = Math.max(startTime, endTime)
  const dates: string[] = []

  for (let time = from; time <= to; time += dayInMs) {
    dates.push(inputFromDate(new Date(time)))
  }

  return dates
}

function displayDate(value: string) {
  const [year, month, day] = value.split('-')

  return `${day}/${month}/${year}`
}

function displayChartDate(value: string, includeYear: boolean) {
  const [year, month, day] = value.split('-')

  return includeYear ? `${day}/${month}/${year}` : `${day}/${month}`
}

function dateRangeSpansMultipleYears(selectedDates: string[]) {
  const years = new Set(selectedDates.map((date) => date.slice(0, 4)))

  return years.size > 1
}

function isoDateFromDisplayDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)

  if (!match) {
    return null
  }

  const [, day, month, year] = match
  const isoDate = `${year}-${month}-${day}`
  const parsedDate = dateFromInput(isoDate)

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getUTCFullYear() !== Number(year) ||
    parsedDate.getUTCMonth() + 1 !== Number(month) ||
    parsedDate.getUTCDate() !== Number(day)
  ) {
    return null
  }

  return isoDate
}

function dateIndex(value: string) {
  return Math.round(
    (dateFromInput(value).getTime() -
      dateFromInput(defaultStartDate).getTime()) / dayInMs
  )
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor
}

function chartColor(index: number) {
  return colors[index % colors.length]
}

function marketColor(index: number) {
  return marketColors[index % marketColors.length]
}

function metricValueForDate(
  values: number[],
  date: string,
  shipIndex: number
) {
  const index = dateIndex(date)
  const baseValue =
    values[positiveModulo(index, values.length)] ?? latestValue(values)
  const seasonalDrift = Math.round(Math.sin((index + shipIndex) / 4) * 3)
  const shipOffset = shipIndex % 3

  return baseValue + seasonalDrift + shipOffset
}

function co2ValueForDate(ship: Ship, date: string, shipIndex: number) {
  const speed = metricValueForDate(ship.speed, date, shipIndex)
  const fuel = metricValueForDate(ship.fuel, date, shipIndex)

  return Math.round((speed * 2.4 + (100 - fuel) * 0.42) * 10) / 10
}

function oilMarketValueForDate(
  date: string,
  basePrice: number,
  marketIndex: number
) {
  const index = dateIndex(date)
  const wave = Math.sin((index + marketIndex * 2) / 5) * 4.5
  const trend = Math.cos((index + marketIndex) / 11) * 2.2

  return Math.round((basePrice + wave + trend + marketIndex * 3) * 100) / 100
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
  getValues: (ship: Ship) => number[],
  selectedDates: string[]
) {
  const selectedDate =
    selectedDates[selectedDates.length - 1] ?? defaultStartDate

  return {
    labels: shipNames,
    datasets: [
      {
        label,
        data: typedShips.map((ship, index) =>
          metricValueForDate(getValues(ship), selectedDate, index)
        ),
        backgroundColor: colors,
        borderRadius: 6,
      },
    ],
  }
}

// Creates one line per ship for a metric measured throughout the day.
function trendDataset(
  getValues: (ship: Ship) => number[],
  selectedDates: string[]
) {
  const includeYear = dateRangeSpansMultipleYears(selectedDates)

  return {
    labels: selectedDates.map((date) => displayChartDate(date, includeYear)),
    datasets: typedShips.map((ship, index) => ({
      label: ship.name,
      data: selectedDates.map((date) =>
        metricValueForDate(getValues(ship), date, index)
      ),
      borderColor: chartColor(index),
      backgroundColor: chartColor(index),
      tension: 0.35,
    })),
  }
}

function co2EmissionsDataset(selectedDates: string[]) {
  const includeYear = dateRangeSpansMultipleYears(selectedDates)

  return {
    labels: selectedDates.map((date) => displayChartDate(date, includeYear)),
    datasets: typedShips.map((ship, index) => ({
      label: ship.name,
      data: selectedDates.map((date) => co2ValueForDate(ship, date, index)),
      borderColor: chartColor(index),
      backgroundColor: chartColor(index),
      tension: 0.35,
    })),
  }
}

function oilMarketDataset(selectedDates: string[]) {
  const includeYear = dateRangeSpansMultipleYears(selectedDates)
  const markets = [
    { label: 'Brent crude', basePrice: 84 },
    { label: 'Marine fuel oil', basePrice: 71 },
    { label: 'Marine gas oil', basePrice: 92 },
    { label: 'Diesel', basePrice: 96 },
  ]

  return {
    labels: selectedDates.map((date) => displayChartDate(date, includeYear)),
    datasets: markets.map((market, index) => ({
      label: market.label,
      data: selectedDates.map((date) =>
        oilMarketValueForDate(date, market.basePrice, index)
      ),
      borderColor: marketColor(index),
      backgroundColor: marketColor(index),
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

function DateRangeField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const fieldRef = useRef<HTMLDivElement | null>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [displayValue, setDisplayValue] = useState(displayDate(value))
  const [visibleMonth, setVisibleMonth] = useState(monthStartFromInput(value))
  const calendarDates = calendarDatesForMonth(visibleMonth)

  useEffect(() => {
    if (!isCalendarOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!fieldRef.current?.contains(event.target as Node)) {
        setIsCalendarOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isCalendarOpen])

  function selectDate(date: string) {
    setDisplayValue(displayDate(date))
    setVisibleMonth(monthStartFromInput(date))
    setIsCalendarOpen(false)
    onChange(date)
  }

  return (
    <div
      ref={fieldRef}
      className="relative grid gap-2 text-sm font-medium text-slate-200"
    >
      <label htmlFor={id}>{label}</label>

      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        value={displayValue}
        onBlur={(event) => {
          const parsedDate = isoDateFromDisplayDate(event.currentTarget.value)

          if (!parsedDate) {
            setDisplayValue(displayDate(value))
          }
        }}
        onChange={(event) => {
          const nextValue = event.target.value
          const parsedDate = isoDateFromDisplayDate(nextValue)

          setDisplayValue(nextValue)

          if (parsedDate) {
            onChange(parsedDate)
            setVisibleMonth(monthStartFromInput(parsedDate))
          }
        }}
        onClick={() => setIsCalendarOpen(true)}
        onFocus={() => setIsCalendarOpen(true)}
        className="h-11 rounded-md border border-[var(--border)] bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-cyan-300"
      />

      {isCalendarOpen && (
        <div
          className="absolute right-0 top-full z-20 mt-2 w-72 rounded-lg border border-[var(--border)] bg-slate-950 p-3 text-white shadow-2xl shadow-black/40"
          onMouseDown={(event) => event.preventDefault()}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
              onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
            >
              {'<'}
            </button>

            <p className="text-sm font-semibold">
              {monthLabels[visibleMonth.getUTCMonth()]}{' '}
              {visibleMonth.getUTCFullYear()}
            </p>

            <button
              type="button"
              aria-label="Next month"
              className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
              onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
            >
              {'>'}
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] uppercase text-slate-400">
            {weekdayLabels.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDates.map((date, index) =>
              date ? (
                <button
                  key={date}
                  type="button"
                  className={`h-8 rounded-md text-sm transition ${
                    date === value
                      ? 'bg-cyan-300 font-semibold text-slate-950'
                      : 'bg-white/5 text-slate-100 hover:bg-white/15'
                  }`}
                  onClick={() => selectDate(date)}
                >
                  {dateFromInput(date).getUTCDate()}
                </button>
              ) : (
                <span key={`empty-${index}`} className="h-8" />
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Renders the dashboard charts for speed, fuel, and temperature.
export default function ShipCharts() {
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)
  const selectedDates = useMemo(
    () => datesInRange(startDate, endDate),
    [startDate, endDate]
  )

  return (
    <div className="grid grid-cols-1 gap-6 p-6">
      <section className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h2 className="text-xl font-bold">Dashboard period</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Showing data from{' '}
            {displayDate(selectedDates[0] ?? defaultStartDate)} to{' '}
            {displayDate(
              selectedDates[selectedDates.length - 1] ?? defaultEndDate
            )}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DateRangeField
            id="dashboard-start-date"
            label="From"
            value={startDate}
            onChange={setStartDate}
          />

          <DateRangeField
            id="dashboard-end-date"
            label="To"
            value={endDate}
            onChange={setEndDate}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Current Speed">
          <Bar
            data={latestMetricDataset(
              'Knots',
              (ship) => ship.speed,
              selectedDates
            )}
            options={chartOptions({
              title: 'knots',
              beginAtZero: true,
            })}
          />
        </ChartCard>

        <ChartCard title="Current Fuel Level">
          <Bar
            data={latestMetricDataset(
              'Fuel %',
              (ship) => ship.fuel,
              selectedDates
            )}
            options={chartOptions({
              title: '%',
              beginAtZero: true,
              max: 100,
            })}
          />
        </ChartCard>

        <ChartCard title="Fuel Trend">
          <Line
            data={trendDataset((ship) => ship.fuel, selectedDates)}
            options={chartOptions({
              title: '%',
              min: 0,
              max: 100,
            })}
          />
        </ChartCard>

        <ChartCard title="Temperature Trend">
          <Line
            data={trendDataset((ship) => ship.temperature, selectedDates)}
            options={chartOptions({
              title: 'Celsius',
            })}
          />
        </ChartCard>

        <ChartCard title="CO2 Emissions">
          <Line
            data={co2EmissionsDataset(selectedDates)}
            options={chartOptions({
              title: 'tons / day',
              beginAtZero: true,
            })}
          />
        </ChartCard>

        <ChartCard title="Oil & Derivatives Prices">
          <Line
            data={oilMarketDataset(selectedDates)}
            options={chartOptions({
              title: 'USD / barrel',
            })}
          />
        </ChartCard>
      </div>
    </div>
  )
}
