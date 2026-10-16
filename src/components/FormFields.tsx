import { useId } from 'react'

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

const INPUT = `mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${FOCUS_RING}`

const LABEL = 'text-sm font-semibold text-slate-800 dark:text-slate-100'

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

export const NumberField = ({
  label,
  value,
  onChange,
  min = 0,
  step = 'any',
}: FieldProps & { min?: number; step?: number | 'any' }) => {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
      />
    </div>
  )
}

export const DateField = ({ label, value, onChange }: FieldProps) => {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
      />
    </div>
  )
}

export const TextField = ({
  label,
  value,
  onChange,
  maxLength,
}: FieldProps & { maxLength?: number }) => {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
      />
    </div>
  )
}

export const SelectField = ({
  label,
  value,
  onChange,
  options,
}: FieldProps & { options: { value: string; label: string }[] }) => {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} cursor-pointer`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export type ResultRow = { label: string; value: string; strong?: boolean }

/** Tarjeta de resultados de las calculadoras. */
export const ResultCard = ({ rows, note }: { rows: ResultRow[]; note?: string }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <dl className="space-y-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className={`flex items-baseline justify-between gap-4 text-sm ${
            row.strong
              ? 'border-t border-slate-200 pt-3 text-base font-bold text-emerald-600 dark:border-slate-800 dark:text-emerald-400'
              : 'text-slate-800 dark:text-slate-100'
          }`}
        >
          <dt className={row.strong ? '' : 'text-slate-500 dark:text-slate-400'}>{row.label}</dt>
          <dd className="font-semibold">{row.value}</dd>
        </div>
      ))}
    </dl>
    {note && <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{note}</p>}
  </div>
)
