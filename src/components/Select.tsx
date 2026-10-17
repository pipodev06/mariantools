import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { IconCheck, IconChevronDown } from '@tabler/icons-react'
import { INPUT } from '../lib/ui'

export type SelectOption = { value: string; label: string }

type SelectProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  /** `id` del botón, para enlazarlo con un `<label htmlFor>`. */
  id?: string
  ariaLabel?: string
  /** Clases del botón; por defecto, ancho completo como `INPUT`. */
  className?: string
}

/** Lista desplegable propia: el resaltado ocupa todo el ancho y se ve igual en todos los navegadores. */
const Select = ({ value, onChange, options, id, ariaLabel, className = INPUT }: SelectProps) => {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selectedIndex = Math.max(
    options.findIndex((o) => o.value === value),
    0,
  )
  const [active, setActive] = useState(selectedIndex)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const choose = (index: number) => {
    onChange(options[index].value)
    setOpen(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape') return setOpen(false)
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (step || e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      if (!open) {
        setActive(selectedIndex)
        return setOpen(true)
      }
      setActive((i) =>
        e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : Math.min(Math.max(i + step, 0), options.length - 1),
      )
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (open) choose(active)
      else {
        setActive(selectedIndex)
        setOpen(true)
      }
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => {
          setActive(selectedIndex)
          setOpen((o) => !o)
        }}
        onKeyDown={onKeyDown}
        className={`${className} flex cursor-pointer items-center justify-between gap-2 text-left`}
      >
        <span className="truncate">{options[selectedIndex]?.label}</span>
        <IconChevronDown size={16} aria-hidden="true" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-60 min-w-max overflow-y-auto rounded-lg border border-slate-500 bg-white p-1 shadow-lg dark:bg-slate-900"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${
                o.value === value
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400'
                  : 'text-slate-800 dark:text-slate-100'
              } ${i === active && o.value !== value ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
            >
              {o.label}
              {o.value === value && <IconCheck size={16} aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Select
