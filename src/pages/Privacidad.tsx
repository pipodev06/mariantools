import LegalPage, { LegalSection } from '../components/LegalPage'
import { CONTACT_EMAIL, OWNER_NAME } from '../data/site'

const Privacidad = () => (
  <LegalPage title="Política de privacidad">
    <LegalSection title="Quién es el responsable">
      <p>
        MarianTools{OWNER_NAME ? `, a cargo de ${OWNER_NAME}` : ''}, es el responsable del tratamiento de los datos
        descritos aquí, conforme a la Ley N.º 29733, Ley de Protección de Datos Personales del Perú.
      </p>
    </LegalSection>

    <LegalSection title="Herramientas que se procesan en tu navegador">
      <p>
        La mayoría de las herramientas (PDF, imágenes, calculadoras, texto, contraseñas, QR) trabajan
        dentro de tu navegador. Tus archivos no se suben a nuestros servidores.
      </p>
    </LegalSection>

    <LegalSection title="Herramientas con IA">
      <p>
        Las herramientas marcadas con «IA» envían tu imagen, texto o audio a nuestro servidor y de ahí a
        un proveedor de IA de terceros, que lo procesa y devuelve el resultado. Nosotros no guardamos tus
        archivos ni los resultados. El proveedor puede conservar o usar los datos según sus propios
        términos, por eso no envíes documentos con información que no quieras compartir con un tercero.
      </p>
    </LegalSection>

    <LegalSection title="Tu cuenta y tus créditos">
      <p>
        Si creas una cuenta guardamos tu correo electrónico, tu saldo de créditos y el historial de
        movimientos (usos, devoluciones y recargas). Los datos se almacenan en Supabase. Si entras con Google, recibimos de Google tu correo y tu nombre público; solo usamos el correo para identificarte. Usamos tu correo
        solo para que puedas iniciar sesión.
      </p>
    </LegalSection>

    <LegalSection title="Límite gratuito diario">
      <p>
        Para limitar el uso gratuito de la IA guardamos, por día, un identificador irreversible
        (un hash) derivado de tu dirección IP, nunca la IP misma. Se usa solo para contar tus usos.
      </p>
    </LegalSection>

    <LegalSection title="Almacenamiento en tu navegador">
      <p>
        Guardamos en tu navegador la sesión de tu cuenta y las últimas herramientas que abriste, para
        mostrártelas en el inicio. No usamos esos datos para otros fines. Actualmente el sitio no muestra
        publicidad; si eso cambia, actualizaremos esta política antes.
      </p>
    </LegalSection>

    <LegalSection title="Tus derechos">
      <p>
        Puedes pedir acceso, rectificación, cancelación u oposición sobre tus datos, incluida la
        eliminación de tu cuenta
        {CONTACT_EMAIL ? (
          <>
            , escribiendo a{' '}
            <a className="font-semibold text-emerald-800 dark:text-emerald-400" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </>
        ) : (
          ' desde la página de contacto'
        )}
        .
      </p>
    </LegalSection>

    <LegalSection title="Cambios">
      <p>Si cambiamos esta política, publicaremos la nueva versión aquí con su fecha de actualización.</p>
    </LegalSection>
  </LegalPage>
)

export default Privacidad
