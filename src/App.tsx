import { Routes, Route } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import Inicio from './pages/Inicio'
import Ocr from './pages/Ocr'
import ImagenABase64 from './pages/ImagenABase64'
import Contrasenas from './pages/Contrasenas'
import Qr from './pages/Qr'
import Comparador from './pages/Comparador'
import Paleta from './pages/Paleta'
import Facturas from './pages/Facturas'
import ComprimirImagen from './pages/ComprimirImagen'
import ImagenAPdf from './pages/ImagenAPdf'
import Redimensionar from './pages/Redimensionar'
import MarcaDeAgua from './pages/MarcaDeAgua'
import Exif from './pages/Exif'
import EditorPdf from './pages/EditorPdf'
import FirmaPdf from './pages/FirmaPdf'
import TextoAVoz from './pages/TextoAVoz'
import MarkdownConverter from './pages/MarkdownConverter'
import CalculadoraFechas from './pages/CalculadoraFechas'

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
      </Route>
    </Routes>
  )
}

export default App
