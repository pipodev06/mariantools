import { Routes, Route } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import Inicio from './pages/Inicio'
import Herramientas from './pages/Herramientas'
import Ocr from './pages/Ocr'

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Inicio />} />
        <Route path="tools" element={<Herramientas />} />
        <Route path="ocr" element={<Ocr />} />
      </Route>
    </Routes>
  )
}

export default App
