import { useEffect, useRef, useState } from 'react'
import { IconPlayerPlay, IconPlayerStop, IconVolume } from '@tabler/icons-react'
import OtherTools from '../components/OtherTools'

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

const CARD = 'rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'

const FIELD =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

const CAN_SPEAK = typeof window !== 'undefined' && 'speechSynthesis' in window

const TextoAVoz = () => {
  const [text, setText] = useState('')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceIndex, setVoiceIndex] = useState(0)
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (!CAN_SPEAK) return

    const loadVoices = () => {
      const available = speechSynthesis.getVoices()
      if (available.length === 0) return
      setVoices(available)
      const spanishIndex = available.findIndex((v) => v.lang.startsWith('es'))
      setVoiceIndex((prev) => (prev === 0 && spanishIndex >= 0 ? spanishIndex : prev))
    }

    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [])

  useEffect(() => () => speechSynthesis.cancel(), [])

  const speak = () => {
    if (!CAN_SPEAK || !text.trim()) return
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const voice = voices[voiceIndex]
    if (voice) utterance.voice = voice
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    utteranceRef.current = utterance

    speechSynthesis.speak(utterance)
    setIsSpeaking(true)
  }

  const stop = () => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          Texto a voz
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Convierte texto escrito en audio narrado, directo en tu navegador.
        </p>

        {!CAN_SPEAK ? (
          <div className={`${CARD} mt-8 p-6 text-center text-sm text-slate-500 dark:text-slate-400`}>
            Tu navegador no soporta síntesis de voz (Web Speech API).
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className={`${CARD} p-6`}>
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Texto
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder="Escribe o pega el texto que quieres escuchar"
                className={`${FIELD} ${FOCUS_RING}`}
              />

              <div className="mt-4">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Voz</label>
                <select
                  value={voiceIndex}
                  onChange={(e) => setVoiceIndex(Number(e.target.value))}
                  className={`${FIELD} ${FOCUS_RING} cursor-pointer`}
                >
                  {voices.map((v, i) => (
                    <option key={`${v.name}-${v.lang}`} value={i}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Velocidad
                    </label>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{rate.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className={`mt-2 w-full cursor-pointer accent-emerald-600 ${FOCUS_RING}`}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Tono
                    </label>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{pitch.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={pitch}
                    onChange={(e) => setPitch(Number(e.target.value))}
                    className={`mt-2 w-full cursor-pointer accent-emerald-600 ${FOCUS_RING}`}
                  />
                </div>
              </div>
            </div>

            <div className={`${CARD} flex flex-col items-center justify-center gap-4 p-6 text-center`}>
              <IconVolume
                className={isSpeaking ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-700'}
                size={64}
                stroke={1.5}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!text.trim()}
                  onClick={speak}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700 ${FOCUS_RING}`}
                >
                  <IconPlayerPlay size={18} />
                  {isSpeaking ? 'Reiniciar' : 'Reproducir'}
                </button>
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={stop}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-600 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-400 ${FOCUS_RING}`}
                  >
                    <IconPlayerStop size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
      <OtherTools currentHref="/texto-a-voz" />
    </>
  )
}

export default TextoAVoz
