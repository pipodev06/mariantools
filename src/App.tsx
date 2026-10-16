import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import Inicio from './pages/Inicio'

// Cada herramienta es su propio chunk: el visitante solo descarga la que abre (pdfjs, transformers,
// tesseract, jspdf, etc. no se cargan en el Home). El Suspense está en MainLayout.
const Ocr = lazy(() => import('./pages/Ocr'))
const ImagenABase64 = lazy(() => import('./pages/ImagenABase64'))
const Contrasenas = lazy(() => import('./pages/Contrasenas'))
const Qr = lazy(() => import('./pages/Qr'))
const Comparador = lazy(() => import('./pages/Comparador'))
const Paleta = lazy(() => import('./pages/Paleta'))
const Facturas = lazy(() => import('./pages/Facturas'))
const ComprimirImagen = lazy(() => import('./pages/ComprimirImagen'))
const ImagenAPdf = lazy(() => import('./pages/ImagenAPdf'))
const Redimensionar = lazy(() => import('./pages/Redimensionar'))
const MarcaDeAgua = lazy(() => import('./pages/MarcaDeAgua'))
const Exif = lazy(() => import('./pages/Exif'))
const EditorPdf = lazy(() => import('./pages/EditorPdf'))
const FirmaPdf = lazy(() => import('./pages/FirmaPdf'))
const TextoAVoz = lazy(() => import('./pages/TextoAVoz'))
const MarkdownConverter = lazy(() => import('./pages/MarkdownConverter'))
const CalculadoraFechas = lazy(() => import('./pages/CalculadoraFechas'))
const Manuscrito = lazy(() => import('./pages/Manuscrito'))
const ExtractorTablas = lazy(() => import('./pages/ExtractorTablas'))
const TraductorImagen = lazy(() => import('./pages/TraductorImagen'))
const CorrectorOrtografico = lazy(() => import('./pages/CorrectorOrtografico'))
const ResumenTexto = lazy(() => import('./pages/ResumenTexto'))
const PdfATexto = lazy(() => import('./pages/PdfATexto'))
const AudioATexto = lazy(() => import('./pages/AudioATexto'))
const QuitarFondo = lazy(() => import('./pages/QuitarFondo'))
const ComprimirPdf = lazy(() => import('./pages/ComprimirPdf'))
const PdfAJpg = lazy(() => import('./pages/PdfAJpg'))
const PdfAWord = lazy(() => import('./pages/PdfAWord'))
const RotarPdf = lazy(() => import('./pages/RotarPdf'))
const NumerarPaginasPdf = lazy(() => import('./pages/NumerarPaginasPdf'))
const RecortarPdf = lazy(() => import('./pages/RecortarPdf'))
const CalculadoraCts = lazy(() => import('./pages/CalculadoraCts'))
const CalculadoraGratificacion = lazy(() => import('./pages/CalculadoraGratificacion'))
const CalculadoraLiquidacion = lazy(() => import('./pages/CalculadoraLiquidacion'))
const CalculadoraHorasExtras = lazy(() => import('./pages/CalculadoraHorasExtras'))
const CalculadoraIgv = lazy(() => import('./pages/CalculadoraIgv'))
const ValidadorRuc = lazy(() => import('./pages/ValidadorRuc'))
const Cuenta = lazy(() => import('./pages/Cuenta'))
const NoEncontrada = lazy(() => import('./pages/NoEncontrada'))

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Inicio />} />
        <Route path="ocr" element={<Ocr />} />
        <Route path="base64" element={<ImagenABase64 />} />
        <Route path="contrasenas" element={<Contrasenas />} />
        <Route path="qr" element={<Qr />} />
        <Route path="comparador" element={<Comparador />} />
        <Route path="paleta" element={<Paleta />} />
        <Route path="facturas" element={<Facturas />} />
        <Route path="comprimir" element={<ComprimirImagen />} />
        <Route path="imagen-a-pdf" element={<ImagenAPdf />} />
        <Route path="redimensionar" element={<Redimensionar />} />
        <Route path="marca-de-agua" element={<MarcaDeAgua />} />
        <Route path="exif" element={<Exif />} />
        <Route path="editor-pdf" element={<EditorPdf />} />
        <Route path="firma-pdf" element={<FirmaPdf />} />
        <Route path="texto-a-voz" element={<TextoAVoz />} />
        <Route path="markdown" element={<MarkdownConverter />} />
        <Route path="calculadora-fechas" element={<CalculadoraFechas />} />
        <Route path="manuscrito" element={<Manuscrito />} />
        <Route path="extractor-tablas" element={<ExtractorTablas />} />
        <Route path="traductor-imagen" element={<TraductorImagen />} />
        <Route path="corrector" element={<CorrectorOrtografico />} />
        <Route path="resumen" element={<ResumenTexto />} />
        <Route path="pdf-a-texto" element={<PdfATexto />} />
        <Route path="audio-a-texto" element={<AudioATexto />} />
        <Route path="quitar-fondo" element={<QuitarFondo />} />
        <Route path="comprimir-pdf" element={<ComprimirPdf />} />
        <Route path="pdf-a-jpg" element={<PdfAJpg />} />
        <Route path="pdf-a-word" element={<PdfAWord />} />
        <Route path="rotar-pdf" element={<RotarPdf />} />
        <Route path="numerar-paginas-pdf" element={<NumerarPaginasPdf />} />
        <Route path="recortar-pdf" element={<RecortarPdf />} />
        <Route path="calculadora-cts" element={<CalculadoraCts />} />
        <Route path="calculadora-gratificacion" element={<CalculadoraGratificacion />} />
        <Route path="calculadora-liquidacion" element={<CalculadoraLiquidacion />} />
        <Route path="calculadora-horas-extras" element={<CalculadoraHorasExtras />} />
        <Route path="calculadora-igv" element={<CalculadoraIgv />} />
        <Route path="validador-ruc" element={<ValidadorRuc />} />
        <Route path="cuenta" element={<Cuenta />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}

export default App
