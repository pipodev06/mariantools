import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
} from 'react'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import OtherTools from '../components/OtherTools'
import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconQrcode,
  IconUpload,
  IconX,
} from '@tabler/icons-react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXT = '.jpg,.jpeg,.png,.webp'

const CAN_COPY_IMAGE = typeof window !== 'undefined' && 'ClipboardItem' in window

type Mode = 'generate' | 'read'
type QrType = 'text' | 'url' | 'wifi' | 'contact'
type WifiSecurity = 'WPA' | 'WEP' | 'nopass'

const QR_TYPES: { key: QrType; label: string }[] = [
  { key: 'text', label: 'Texto' },
  { key: 'url', label: 'URL' },
  { key: 'wifi', label: 'WiFi' },
  { key: 'contact', label: 'Contacto' },
]

const escapeWifi = (value: string) => value.replace(/([\\;,:"])/g, '\\$1')

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

const CARD =
  'rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'

const FIELD =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

const Qr = () => {
  const [mode, setMode] = useState<Mode>('generate')
  const [qrType, setQrType] = useState<QrType>('text')

  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [wifiSsid, setWifiSsid] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [wifiSecurity, setWifiSecurity] = useState<WifiSecurity>('WPA')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  const [fgColor, setFgColor] = useState('#0f172a')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [copiedImage, setCopiedImage] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [readFile, setReadFile] = useState<{ file: File; previewUrl: string } | null>(null)
  const [readResult, setReadResult] = useState<string | null>(null)
  const [readError, setReadError] = useState(false)
  const [copiedText, setCopiedText] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const qrValue = (() => {
    if (qrType === 'text') return text.trim()
    if (qrType === 'url') return url.trim()
    if (qrType === 'wifi') {
      if (!wifiSsid.trim()) return ''
      const password = wifiSecurity === 'nopass' ? '' : escapeWifi(wifiPassword)
      return `WIFI:T:${wifiSecurity};S:${escapeWifi(wifiSsid)};P:${password};;`
    }
    if (!contactName.trim()) return ''
    return `BEGIN:VCARD\nVERSION:3.0\nN:;${contactName};;;\nFN:${contactName}\nTEL:${contactPhone}\nEMAIL:${contactEmail}\nEND:VCARD`
  })()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !qrValue) return
    QRCode.toCanvas(canvas, qrValue, {
      width: 260,
      margin: 2,
      color: { dark: fgColor, light: bgColor },
    }).catch(() => {})
  }, [qrValue, fgColor, bgColor, mode])

  const downloadQr = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'codigo-qr.png'
    a.click()
  }

  const copyQrImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (!blob) return
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      setCopiedImage(true)
      setTimeout(() => setCopiedImage(false), 1500)
    })
  }

  const decodeFile = async (file: File) => {
    const previewUrl = URL.createObjectURL(file)
    setReadFile((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return { file, previewUrl }
    })
    setReadResult(null)
    setReadError(false)

    try {
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No se pudo crear el contexto de canvas')
      ctx.drawImage(bitmap, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const result = jsQR(imageData.data, imageData.width, imageData.height)
      if (result?.data) {
        setReadResult(result.data)
      } else {
        setReadError(true)
      }
    } catch {
      setReadError(true)
    }
  }

  const addReadFile = (incoming: FileList | File[]) => {
    const file = Array.from(incoming).find((f) => ACCEPTED_TYPES.includes(f.type))
    if (file) decodeFile(file)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    addReadFile(e.dataTransfer.files)
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current += 1
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addReadFile(e.target.files)
    e.target.value = ''
  }

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData.files.length) addReadFile(e.clipboardData.files)
  }

  const removeReadFile = () => {
    if (readFile) URL.revokeObjectURL(readFile.previewUrl)
    setReadFile(null)
    setReadResult(null)
    setReadError(false)
  }

  const copyReadResult = async () => {
    if (!readResult) return
    await navigator.clipboard.writeText(readResult)
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 1500)
  }

  const isUrl = readResult ? /^https?:\/\//i.test(readResult) : false

  return (
    <>
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
        Generador y lector de QR
      </h1>
      <p className="mt-2 max-w-2xl text-base text-slate-500 dark:text-slate-400">
        Crea códigos QR o lee uno desde una imagen, directo en tu navegador.
      </p>

      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-800">
          {(['generate', 'read'] as const).map((m) => (
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
              {m === 'generate' ? 'Generar' : 'Leer'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'generate' ? (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className={`${CARD} p-6`}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {QR_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setQrType(t.key)}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${FOCUS_RING} ${
                    qrType === t.key
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {qrType === 'text' && (
                <div>
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Texto
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    placeholder="Escribe el texto que querés convertir en QR"
                    className={`${FIELD} ${FOCUS_RING}`}
                  />
                </div>
              )}

              {qrType === 'url' && (
                <div>
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://ejemplo.com"
                    className={`${FIELD} ${FOCUS_RING}`}
                  />
                </div>
              )}

              {qrType === 'wifi' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Nombre de red (SSID)
                    </label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      className={`${FIELD} ${FOCUS_RING}`}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Seguridad
                    </label>
                    <select
                      value={wifiSecurity}
                      onChange={(e) => setWifiSecurity(e.target.value as WifiSecurity)}
                      className={`${FIELD} ${FOCUS_RING} cursor-pointer`}
                    >
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Sin contraseña</option>
                    </select>
                  </div>
                  {wifiSecurity !== 'nopass' && (
                    <div>
                      <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Contraseña
                      </label>
                      <input
                        type="text"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        className={`${FIELD} ${FOCUS_RING}`}
                      />
                    </div>
                  )}
                </div>
              )}

              {qrType === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className={`${FIELD} ${FOCUS_RING}`}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className={`${FIELD} ${FOCUS_RING}`}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Email
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className={`${FIELD} ${FOCUS_RING}`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Color del QR
                </label>
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className={`mt-1 h-10 w-full cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 ${FOCUS_RING}`}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Color de fondo
                </label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className={`mt-1 h-10 w-full cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 ${FOCUS_RING}`}
                />
              </div>
            </div>
          </div>

          <div className={`${CARD} flex flex-col items-center justify-center p-6 text-center`}>
            {qrValue ? (
              <>
                <canvas ref={canvasRef} className="rounded-lg" />
                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    onClick={downloadQr}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 ${FOCUS_RING}`}
                  >
                    <IconDownload size={18} />
                    Descargar
                  </button>
                  {CAN_COPY_IMAGE && (
                    <button
                      type="button"
                      onClick={copyQrImage}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-600 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-400 ${FOCUS_RING}`}
                    >
                      {copiedImage ? <IconCheck size={18} /> : <IconCopy size={18} />}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <IconQrcode className="text-slate-300 dark:text-slate-700" size={64} stroke={1.5} />
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Completa los datos para ver el código QR
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            className={`flex min-h-72 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${FOCUS_RING} ${
              isDragging
                ? 'border-emerald-600 bg-emerald-50/60 dark:border-emerald-400 dark:bg-emerald-500/10'
                : 'border-slate-300 bg-white hover:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-400'
            }`}
          >
            {readFile ? (
              <div className="relative">
                <img
                  src={readFile.previewUrl}
                  alt={readFile.file.name}
                  className="max-h-56 rounded-lg object-contain"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeReadFile()
                  }}
                  className={`absolute -right-2 -top-2 cursor-pointer rounded-full bg-slate-800 p-1 text-white hover:bg-emerald-600 ${FOCUS_RING}`}
                >
                  <IconX size={16} />
                </button>
              </div>
            ) : (
              <>
                <IconUpload
                  className={
                    isDragging
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }
                  size={32}
                  stroke={1.5}
                />
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {isDragging
                    ? 'Suelta la imagen aquí'
                    : 'Arrastra una imagen con QR aquí o haz click para elegirla'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  También puedes pegarla con Ctrl+V. Formatos: JPG, PNG, WebP.
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXT}
              onChange={handleChange}
              className="hidden"
            />
          </div>

          <div className={`${CARD} flex min-h-72 flex-col justify-center p-6`}>
            {readResult ? (
              <div className="motion-safe:animate-[reveal-up_0.4s_ease-out_forwards]">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Contenido detectado
                </h3>
                <p className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm break-all text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                  {readResult}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={copyReadResult}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-600 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-400 ${FOCUS_RING}`}
                  >
                    {copiedText ? <IconCheck size={18} /> : <IconCopy size={18} />}
                    Copiar
                  </button>
                  {isUrl && (
                    <a
                      href={readResult}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 ${FOCUS_RING}`}
                    >
                      <IconExternalLink size={18} />
                      Abrir enlace
                    </a>
                  )}
                </div>
              </div>
            ) : readError ? (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                No se encontró ningún código QR en esa imagen.
              </p>
            ) : (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                El contenido del QR va a aparecer acá.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
    <OtherTools currentHref="/qr" />
    </>
  )
}

export default Qr
