import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** React Router no reinicia el scroll al navegar: sin esto, abrir una tool desde abajo del Home deja la página abajo. */
const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default ScrollToTop
