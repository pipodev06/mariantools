import { useEffect, useMemo, useRef, useState } from 'react'
import { IconCheck, IconChevronDown, IconCopy, IconRefresh, IconX } from '@tabler/icons-react'
import { WORDLIST } from '../lib/wordlist'

const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?'

const CHAR_OPTIONS = [
  { key: 'uppercase', name: 'Mayúsculas', sample: 'ABC', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { key: 'lowercase', name: 'Minúsculas', sample: 'abc', chars: 'abcdefghijklmnopqrstuvwxyz' },
  { key: 'numbers', name: 'Números', sample: '123', chars: '0123456789' },
  { key: 'symbols', name: 'Símbolos', sample: '!&*', chars: SYMBOLS },
] as const

type CharKey = (typeof CHAR_OPTIONS)[number]['key']

const SEPARATOR_OPTIONS = [
  { key: 'dash', label: 'Guiones', literal: '-' as string | null },
  { key: 'space', label: 'Espacios', literal: ' ' },
  { key: 'dot', label: 'Puntos', literal: '.' },
  { key: 'comma', label: 'Comas', literal: ',' },
  { key: 'underscore', label: 'Guiones bajos', literal: '_' },
  { key: 'number', label: 'Números', literal: null },
  { key: 'numberSymbol', label: 'Números y símbolos', literal: null },
] as const

type SeparatorKey = (typeof SEPARATOR_OPTIONS)[number]['key']

type Mode = 'random' | 'memorable'

const STRENGTH_LEVELS = {
  weak: { label: 'Débil', badge: 'bg-red-100 text-red-700', stroke: 'text-red-500 dark:text-red-400' },
  medium: {
    label: 'Media',
    badge: 'bg-amber-100 text-amber-700',
    stroke: 'text-amber-500 dark:text-amber-400',
  },
  strong: {
    label: 'Fuerte',
    badge: 'bg-emerald-100 text-emerald-700',
    stroke: 'text-emerald-500 dark:text-emerald-400',
  },
} as const

const MAX_ENTROPY_BITS = 100
const ALT_COUNT = 4

const getEntropyBits = (length: number, charsetSize: number) =>
  length * Math.log2(Math.max(charsetSize, 1))

const getPassphraseBits = (wordCount: number, useNumbers: boolean, sepKey: SeparatorKey) => {
  let bits = wordCount * Math.log2(WORDLIST.length)
  if (useNumbers) bits += wordCount * Math.log2(10)
  if (sepKey === 'number') bits += (wordCount - 1) * Math.log2(10)
  if (sepKey === 'numberSymbol') bits += (wordCount - 1) * (Math.log2(10) + Math.log2(SYMBOLS.length))
  return bits
}

const getStrength = (bits: number) => {
  if (bits < 40) return STRENGTH_LEVELS.weak
  if (bits < 60) return STRENGTH_LEVELS.medium
  return STRENGTH_LEVELS.strong
}

// Estimación conservadora: ataque offline rápido a 10^10 intentos/seg.
const CRACK_UNITS: [string, string, number][] = [
  ['segundo', 'segundos', 1],
  ['minuto', 'minutos', 60],
  ['hora', 'horas', 3600],
  ['día', 'días', 86400],
  ['mes', 'meses', 2629800],
  ['año', 'años', 31557600],
  ['siglo', 'siglos', 3155760000],
]

const estimateCrackTime = (bits: number) => {
  const log10Seconds = (bits - Math.log2(1e10)) * Math.log10(2)
  if (log10Seconds < 0) return 'Instantáneo'

  const seconds = Math.pow(10, log10Seconds)
  let unit = CRACK_UNITS[0]
  for (const candidate of CRACK_UNITS) {
    if (seconds >= candidate[2]) unit = candidate
  }
  const [singular, plural, unitSeconds] = unit
  const value = seconds / unitSeconds
  if (value >= 1e6) return `Millones de ${plural}`
  if (value >= 1e3) return `Miles de ${plural}`
  const rounded = Math.round(value)
  return `${rounded.toLocaleString('es-PE')} ${rounded === 1 ? singular : plural}`
}

const buildCharset = (active: Record<CharKey, boolean>) =>
  CHAR_OPTIONS.filter((opt) => active[opt.key])
    .map((opt) => opt.chars)
    .join('')

const randomInt = (max: number) => {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] % max
}

const generatePassword = (length: number, charset: string) => {
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => charset[byte % charset.length]).join('')
}

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

const getSeparator = (sepKey: SeparatorKey) => {
  const opt = SEPARATOR_OPTIONS.find((o) => o.key === sepKey)
  if (opt?.literal != null) return opt.literal
  if (sepKey === 'number') return String(randomInt(10))
  return SYMBOLS[randomInt(SYMBOLS.length)] + String(randomInt(10))
}

const generatePassphrase = (
  wordCount: number,
  useUpper: boolean,
  useNumbers: boolean,
  sepKey: SeparatorKey,
) => {
  const parts = Array.from({ length: wordCount }, () => {
    let word = WORDLIST[randomInt(WORDLIST.length)]
    if (useUpper) word = capitalize(word)
    if (useNumbers) word += String(randomInt(10))
    return word
  })
  return parts.reduce((acc, part, i) => (i === 0 ? part : acc + getSeparator(sepKey) + part), '')
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

const CARD =
  'rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm backdrop-blur-md dark:border-slate-700/40 dark:bg-slate-800/40'

const OPTION_ROW =
  'flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors'

const Contrasenas = () => {
  const [mode, setMode] = useState<Mode>('random')

  // Modo random
  const [length, setLength] = useState(16)
  const [active, setActive] = useState<Record<CharKey, boolean>>({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })

  // Modo memorable
  const [wordCount, setWordCount] = useState(5)
  const [memorableUpper, setMemorableUpper] = useState(true)
  const [memorableNumbers, setMemorableNumbers] = useState(true)
  const [separator, setSeparator] = useState<SeparatorKey>('dash')
  const [separatorOpen, setSeparatorOpen] = useState(false)
  const separatorRef = useRef<HTMLDivElement>(null)

  const [regenKey, setRegenKey] = useState(0)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    if (!separatorOpen) return

    const handleClick = (e: MouseEvent) => {
      if (separatorRef.current && !separatorRef.current.contains(e.target as Node)) {
        setSeparatorOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSeparatorOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [separatorOpen])

  useEffect(() => {
    if (!infoOpen) return

    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInfoOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [infoOpen])

  const charset = buildCharset(active)
  const bits =
    mode === 'random'
      ? getEntropyBits(length, charset.length)
      : getPassphraseBits(wordCount, memorableNumbers, separator)
  const strength = getStrength(bits)
  const gaugeProgress = Math.min(bits / MAX_ENTROPY_BITS, 1)
  const crackTime = estimateCrackTime(bits)

  const passwords = useMemo(() => {
    if (mode === 'random') {
      return charset
        ? Array.from({ length: ALT_COUNT + 1 }, () => generatePassword(length, charset))
        : []
    }
    return Array.from({ length: ALT_COUNT + 1 }, () =>
      generatePassphrase(wordCount, memorableUpper, memorableNumbers, separator),
    )
    // regenKey solo fuerza un nuevo random con la misma config (botón "Regenerar")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, length, charset, wordCount, memorableUpper, memorableNumbers, separator, regenKey])

  const regenerate = () => setRegenKey((key) => key + 1)

  const toggleOption = (key: CharKey) => {
    setActive((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const copyText = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex((current) => (current === index ? null : current)), 1500)
  }

  const [featured, ...alternates] = passwords

  return (
    <section className="mx-auto max-w-[100rem] px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
        Contraseñas seguras
      </h1>
      <p className="mt-2 max-w-2xl text-lg text-slate-500 dark:text-slate-400">
        Genera contraseñas aleatorias, directo en tu navegador.
      </p>

      <div className="relative mt-8">
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-linear-to-br from-emerald-200/40 via-transparent to-slate-200/40 dark:from-emerald-500/10 dark:via-transparent dark:to-slate-800/20" />

        <div className="grid grid-cols-1 items-start gap-1.5 lg:grid-cols-[auto_auto_auto] lg:justify-center">
          <div className={`${CARD} h-138 w-100 max-lg:h-auto max-lg:w-full`}>
            <div className="flex justify-center">
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-800">
                {(['random', 'memorable'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`cursor-pointer rounded-md px-3 py-1.5 text-base font-medium transition-colors ${FOCUS_RING} ${
                      mode === m
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-500 hover:text-emerald-600 dark:text-slate-400'
                    }`}
                  >
                    {m === 'random' ? 'Random' : 'Memorable'}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'random' ? (
              <>
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="length"
                      className="text-base font-semibold text-slate-800 dark:text-slate-100"
                    >
                      Longitud
                    </label>
                    <span className="text-base text-slate-500 dark:text-slate-400">
                      {length} caracteres
                    </span>
                  </div>
                  <input
                    id="length"
                    type="range"
                    min={8}
                    max={64}
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    className={`mt-2 w-full cursor-pointer accent-emerald-600 ${FOCUS_RING}`}
                  />
                </div>

                <div className="mt-6 space-y-2">
                  {CHAR_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => toggleOption(opt.key)}
                      className={`${OPTION_ROW} ${FOCUS_RING} ${
                        active[opt.key]
                          ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-500/10'
                          : 'border-slate-200 bg-white/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            active[opt.key]
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {active[opt.key] && <IconCheck size={14} />}
                        </span>
                        <span className="text-base font-medium text-slate-800 dark:text-slate-100">
                          {opt.name}
                        </span>
                      </span>
                      <span className="text-base text-slate-500 dark:text-slate-400">
                        {opt.sample}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="wordCount"
                      className="text-base font-semibold text-slate-800 dark:text-slate-100"
                    >
                      Palabras
                    </label>
                    <span className="text-base text-slate-500 dark:text-slate-400">
                      {wordCount}
                    </span>
                  </div>
                  <input
                    id="wordCount"
                    type="range"
                    min={3}
                    max={8}
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    className={`mt-2 w-full cursor-pointer accent-emerald-600 ${FOCUS_RING}`}
                  />
                </div>

                <div className="mt-6 space-y-2">
                  <button
                    type="button"
                    onClick={() => setMemorableUpper((prev) => !prev)}
                    className={`${OPTION_ROW} ${FOCUS_RING} ${
                      memorableUpper
                        ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-500/10'
                        : 'border-slate-200 bg-white/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          memorableUpper
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {memorableUpper && <IconCheck size={14} />}
                      </span>
                      <span className="text-base font-medium text-slate-800 dark:text-slate-100">
                        Letras mayúsculas
                      </span>
                    </span>
                    <span className="text-base text-slate-500 dark:text-slate-400">ABC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMemorableNumbers((prev) => !prev)}
                    className={`${OPTION_ROW} ${FOCUS_RING} ${
                      memorableNumbers
                        ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-500/10'
                        : 'border-slate-200 bg-white/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          memorableNumbers
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {memorableNumbers && <IconCheck size={14} />}
                      </span>
                      <span className="text-base font-medium text-slate-800 dark:text-slate-100">
                        Números
                      </span>
                    </span>
                    <span className="text-base text-slate-500 dark:text-slate-400">123</span>
                  </button>
                </div>

                <div className="relative mt-6" ref={separatorRef}>
                  <label className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    Separadores
                  </label>
                  <button
                    type="button"
                    onClick={() => setSeparatorOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={separatorOpen}
                    className={`mt-2 flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white/50 px-3 py-2.5 text-left text-base text-slate-800 transition-colors dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-100 ${FOCUS_RING}`}
                  >
                    {SEPARATOR_OPTIONS.find((opt) => opt.key === separator)?.label}
                    <IconChevronDown
                      size={18}
                      className={`shrink-0 text-slate-500 transition-transform dark:text-slate-400 ${
                        separatorOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {separatorOpen && (
                    <ul
                      role="listbox"
                      className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg motion-safe:animate-[reveal-up_0.15s_ease-out_forwards] dark:border-slate-800 dark:bg-slate-900"
                    >
                      {SEPARATOR_OPTIONS.map((opt) => (
                        <li key={opt.key} role="option" aria-selected={separator === opt.key}>
                          <button
                            type="button"
                            onClick={() => {
                              setSeparator(opt.key)
                              setSeparatorOpen(false)
                            }}
                            className={`flex w-full cursor-pointer items-center px-3 py-2 text-left text-base transition-colors ${FOCUS_RING} ${
                              separator === opt.key
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : 'text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-100 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400'
                            }`}
                          >
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <div
              className={`${CARD} flex h-68 w-163 max-lg:h-auto max-lg:w-full flex-col items-center justify-center overflow-y-auto text-center`}
            >
              {featured ? (
                <>
                  <div className="flex w-full items-center justify-center gap-3">
                    <span
                      title={featured}
                      className="line-clamp-2 min-w-0 flex-1 break-all text-xl font-semibold text-slate-800 dark:text-slate-100"
                    >
                      {featured}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(featured, -1)}
                      className={`shrink-0 cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-400 ${FOCUS_RING}`}
                    >
                      {copiedIndex === -1 ? <IconCheck size={18} /> : <IconCopy size={18} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={regenerate}
                    className={`mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-700 ${FOCUS_RING}`}
                  >
                    <IconRefresh size={18} />
                    Regenerar
                  </button>
                </>
              ) : (
                <p className="text-base text-slate-500 dark:text-slate-400">
                  Elegí al menos un tipo de carácter.
                </p>
              )}
            </div>

            {alternates.length > 0 && (
              <div className={`${CARD} h-68 w-163 max-lg:h-auto max-lg:w-full overflow-y-auto`}>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Más contraseñas
                </h3>
                <ul className="mt-4 space-y-1">
                  {alternates.map((pwd, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/50 dark:hover:bg-slate-900/40"
                    >
                      <span
                        title={pwd}
                        className="min-w-0 flex-1 truncate text-base text-slate-800 dark:text-slate-100"
                      >
                        {pwd}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText(pwd, i)}
                        className={`shrink-0 cursor-pointer rounded text-slate-500 hover:text-emerald-600 dark:text-slate-400 ${FOCUS_RING}`}
                      >
                        {copiedIndex === i ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div
            className={`${CARD} flex h-138 w-100 max-lg:h-auto max-lg:w-full flex-col items-center justify-center overflow-y-auto text-center`}
          >
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Puntuación de seguridad
            </h2>
            <svg viewBox="0 0 200 110" className="mx-auto mt-2 w-40">
              <path
                d="M10,100 A90,90 0 0 1 190,100"
                fill="none"
                strokeWidth="16"
                strokeLinecap="round"
                pathLength={100}
                className="stroke-slate-200 dark:stroke-slate-800"
              />
              <path
                d="M10,100 A90,90 0 0 1 190,100"
                fill="none"
                strokeWidth="16"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={100 - gaugeProgress * 100}
                className={`stroke-current transition-all ${strength.stroke}`}
              />
            </svg>
            <span
              className={`-mt-6 inline-block rounded-full px-3 py-1 text-base font-semibold ${strength.badge}`}
            >
              {strength.label}
            </span>
            <p className="mt-4 min-h-18 line-clamp-3 text-base text-slate-500 dark:text-slate-400">
              {crackTime} para descifrar esta contraseña
            </p>
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className={`mt-3 cursor-pointer text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400 ${FOCUS_RING}`}
            >
              ¿Cómo saber si mi contraseña es vulnerable?
            </button>
          </div>
        </div>
      </div>

      {infoOpen && (
        <div
          onClick={() => setInfoOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 p-6 motion-safe:animate-[fade-in_0.15s_ease-out]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="¿Cómo saber si mi contraseña es vulnerable?"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border-2 border-[#10b981] bg-white motion-safe:animate-[modal-pop_0.18s_ease-out] dark:border-[#34d399] dark:bg-slate-900"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-emerald-200 bg-white px-6 py-5 dark:border-emerald-900 dark:bg-slate-900">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                ¿Cómo saber si mi contraseña es vulnerable?
              </h2>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className={`ml-3 shrink-0 cursor-pointer rounded text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 ${FOCUS_RING}`}
              >
                <IconX size={20} />
              </button>
            </div>
            <div className="space-y-4 px-6 py-6 text-base text-slate-800 dark:text-slate-100">
              <p>
                Piensa en tu contraseña como la llave de tu casa: si es simple y la repites en
                todas las puertas, cualquiera que la copie una sola vez puede entrar a todos
                lados.
              </p>
              <ul className="list-disc space-y-3 pl-5">
                <li>
                  <strong>Cuanto más larga, mejor.</strong> Una contraseña de 14 caracteres o más
                  es muchísimo más difícil de forzar que una corta, aunque esa corta tenga
                  símbolos raros.
                </li>
                <li>
                  <strong>Evita lo obvio.</strong> Empezar con mayúscula y terminar con un número y
                  un símbolo (como "Contraseña1!") es el primer patrón que prueban los programas
                  que adivinan contraseñas.
                </li>
                <li>
                  <strong>No repitas la misma llave.</strong> Si usas la misma contraseña en varios
                  sitios y uno de ellos sufre un robo de datos, esa contraseña ya no protege
                  ninguna de tus cuentas.
                </li>
                <li>
                  <strong>Nada que cualquiera pueda adivinar.</strong> Tu nombre, tu cumpleaños o
                  el nombre de tu mascota se encuentran fácil en tus redes sociales.
                </li>
                <li>
                  <strong>Revisa si ya se filtró.</strong> Sitios como Have I Been Pwned te dejan
                  buscar gratis si tu correo o contraseña ya aparecieron en alguna filtración
                  conocida — vale la pena revisar de vez en cuando.
                </li>
              </ul>
              <p className="font-medium text-emerald-700 dark:text-emerald-400">
                La buena noticia: no tienes que memorizar nada de esto. Usando el generador de
                arriba ya estás dando el paso más importante.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Basado en las recomendaciones de contraseñas de NIST (SP 800-63B).
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Contrasenas
