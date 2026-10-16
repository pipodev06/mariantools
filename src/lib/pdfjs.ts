import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Un solo lugar configura el worker de pdf.js; las libs de PDF importan `pdfjs` de aquí.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export { pdfjs }
