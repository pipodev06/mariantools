import { useState } from 'react'
import { IconCalendarPlus, IconCalendarStats } from '@tabler/icons-react'
import OtherTools from '../components/OtherTools'

type Mode = 'diff' | 'add'

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

const CARD = 'rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'

const FIELD =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

const WEEKDAY_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

// Parsea "YYYY-MM-DD" como fecha LOCAL (no UTC) — new Date('YYYY-MM-DD') interpreta
// el string como medianoche UTC, lo que puede correr la fecha mostrada un día hacia
// atrás en zonas horarias negativas. Separar y construir con new Date(y, m-1, d) evita eso.
const parseDateInput = (value: string): Date | null => {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

const formatDateInput = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formatLong = (date: Date): string =>
  date.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

const calendarDiff = (start: Date, end: Date) => {
  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()
  let days = end.getDate() - start.getDate()

  if (days < 0) {
    months -= 1
    const prevMonthDays = new Date(end.getFullYear(), end.getMonth(), 0).getDate()
    days += prevMonthDays
  }
  if (months < 0) {
    years -= 1
    months += 12
  }
  return { years, months, days }
}

const countDays = (start: Date, end: Date) => {
  let totalDays = 0
  let businessDays = 0
  const cursor = new Date(start)
  cursor.setDate(cursor.getDate() + 1)

  while (cursor <= end) {
    totalDays += 1
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) businessDays += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return { totalDays, businessDays, weekendDays: totalDays - businessDays }
}

const pluralize = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`

const CalculadoraFechas = () => {
  const [mode, setMode] = useState<Mode>('diff')

  const today = formatDateInput(new Date())
  const [dateA, setDateA] = useState(today)
  const [dateB, setDateB] = useState(today)

  const [baseDate, setBaseDate] = useState(today)
  const [amount, setAmount] = useState(30)
  const [operation, setOperation] = useState<'add' | 'subtract'>('add')

  const parsedA = parseDateInput(dateA)
  const parsedB = parseDateInput(dateB)

  const diffResult = (() => {
    if (!parsedA || !parsedB) return null
    const [start, end] = parsedA <= parsedB ? [parsedA, parsedB] : [parsedB, parsedA]
    return { ...calendarDiff(start, end), ...countDays(start, end) }
  })()

  const addResult = (() => {
    const base = parseDateInput(baseDate)
    if (!base) return null
    const result = new Date(base)
    result.setDate(result.getDate() + (operation === 'add' ? amount : -amount))
    return result
  })()

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          Calculadora de fechas
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Diferencia entre fechas, días hábiles, o suma y resta días a una fecha.
        </p>

        <div className="mt-8 flex justify-start">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-800">
            {(['diff', 'add'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${FOCUS_RING} ${
                  mode === m
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-500 hover:text-emerald-600 dark:text-slate-400'
                }`}
              >
                {m === 'diff' ? 'Diferencia' : 'Sumar o restar'}
              </button>
            ))}
          </div>
        </div>

        {mode === 'diff' ? (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className={`${CARD} p-6`}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Fecha inicial
                  </label>
                  <input
                    type="date"
                    value={dateA}
                    onChange={(e) => setDateA(e.target.value)}
                    className={`${FIELD} ${FOCUS_RING}`}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Fecha final
                  </label>
                  <input
                    type="date"
                    value={dateB}
                    onChange={(e) => setDateB(e.target.value)}
                    className={`${FIELD} ${FOCUS_RING}`}
                  />
                </div>
              </div>
            </div>

            <div className={`${CARD} flex flex-col items-center justify-center gap-4 p-6 text-center`}>
              {diffResult ? (
                <>
                  <IconCalendarStats className="text-emerald-600 dark:text-emerald-400" size={40} stroke={1.5} />
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {pluralize(diffResult.totalDays, 'día', 'días')}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {pluralize(diffResult.years, 'año', 'años')}, {pluralize(diffResult.months, 'mes', 'meses')} y{' '}
                    {pluralize(diffResult.days, 'día', 'días')}
                  </p>
                  <div className="flex gap-6 text-sm">
                    <span className="text-slate-800 dark:text-slate-100">
                      <strong>{diffResult.businessDays}</strong> hábiles
                    </span>
                    <span className="text-slate-800 dark:text-slate-100">
                      <strong>{diffResult.weekendDays}</strong> de fin de semana
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Elige ambas fechas.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className={`${CARD} space-y-4 p-6`}>
              <div>
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Fecha base
                </label>
                <input
                  type="date"
                  value={baseDate}
                  onChange={(e) => setBaseDate(e.target.value)}
                  className={`${FIELD} ${FOCUS_RING}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Operación
                  </label>
                  <div className="mt-1 inline-flex w-full rounded-lg border border-slate-200 p-0.5 dark:border-slate-800">
                    {(['add', 'subtract'] as const).map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setOperation(op)}
                        className={`flex-1 cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors ${FOCUS_RING} ${
                          operation === op
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-500 hover:text-emerald-600 dark:text-slate-400'
                        }`}
                      >
                        {op === 'add' ? 'Sumar' : 'Restar'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Días
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                    className={`${FIELD} ${FOCUS_RING}`}
                  />
                </div>
              </div>
            </div>

            <div className={`${CARD} flex flex-col items-center justify-center gap-3 p-6 text-center`}>
              {addResult ? (
                <>
                  <IconCalendarPlus className="text-emerald-600 dark:text-emerald-400" size={40} stroke={1.5} />
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {formatDateInput(addResult)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{formatLong(addResult)}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {WEEKDAY_LABELS[addResult.getDay()]}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Elige una fecha base.</p>
              )}
            </div>
          </div>
        )}
      </section>
      <OtherTools currentHref="/calculadora-fechas" />
    </>
  )
}

export default CalculadoraFechas
