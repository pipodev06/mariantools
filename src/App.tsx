import { Routes, Route } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import Inicio from './pages/Inicio'
import Herramientas from './pages/Herramientas'
import Ocr from './pages/Ocr'
import ImagenABase64 from './pages/ImagenABase64'
import Contrasenas from './pages/Contrasenas'
import Qr from './pages/Qr'
import Comparador from './pages/Comparador'
import Paleta from './pages/Paleta'
import Facturas from './pages/Facturas'

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Inicio />} />
        <Route path="tools" element={<Herramientas />} />
        <Route path="ocr" element={<Ocr />} />
        <Route path="base64" element={<ImagenABase64 />} />
        <Route path="contrasenas" element={<Contrasenas />} />
        <Route path="qr" element={<Qr />} />
        <Route path="comparador" element={<Comparador />} />
        <Route path="paleta" element={<Paleta />} />
        <Route path="facturas" element={<Facturas />} />
      </Route>
    </Routes>
  )
}

export default App
