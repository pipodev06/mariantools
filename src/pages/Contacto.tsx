import LegalPage, { LegalSection } from '../components/LegalPage'
import { CONTACT_EMAIL } from '../data/site'

const Contacto = () => (
  <LegalPage title="Contacto">
    <LegalSection title="Escríbenos">
      {CONTACT_EMAIL ? (
        <p>
          Para consultas, errores o solicitudes sobre tus datos, escribe a{' '}
          <a className="font-semibold text-emerald-800 dark:text-emerald-400" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      ) : (
        <p>El correo de contacto estará disponible pronto.</p>
      )}
    </LegalSection>
  </LegalPage>
)

export default Contacto
