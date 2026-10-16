import LegalPage, { LegalSection } from '../components/LegalPage'

const Terminos = () => (
  <LegalPage title="Términos de uso">
    <LegalSection title="El servicio">
      <p>
        MarianTools ofrece herramientas web para trabajar con archivos y texto. Al usar el sitio aceptas
        estos términos.
      </p>
    </LegalSection>

    <LegalSection title="Herramientas gratuitas y con IA">
      <p>
        Las herramientas que se procesan en tu navegador son gratuitas. Las herramientas con IA tienen un
        límite gratuito diario y, superado el límite, consumen créditos de tu cuenta. Cada herramienta
        indica cuánto cuesta por uso.
      </p>
    </LegalSection>

    <LegalSection title="Créditos">
      <p>
        Los créditos son prepagados y solo sirven para las herramientas con IA. Si la IA falla y no
        entrega un resultado, el crédito se devuelve. Las condiciones de compra se mostrarán antes de
        cada pago cuando esté disponible.
      </p>
    </LegalSection>

    <LegalSection title="Resultados de la IA y calculadoras">
      <p>
        La IA puede cometer errores al leer o interpretar un documento. Revisa siempre los resultados
        antes de usarlos. Las calculadoras laborales y tributarias son referenciales y no reemplazan la
        asesoría de un contador o abogado.
      </p>
    </LegalSection>

    <LegalSection title="Uso aceptable">
      <p>
        No uses el sitio para actividades ilegales, para vulnerar derechos de terceros ni para saturar
        el servicio de forma automatizada. Podemos limitar o suspender el acceso ante un uso abusivo.
      </p>
    </LegalSection>

    <LegalSection title="Garantía y responsabilidad">
      <p>
        El servicio se ofrece «tal cual», sin garantía de disponibilidad continua. En la medida que la
        ley lo permita, no respondemos por pérdidas derivadas del uso de los resultados.
      </p>
    </LegalSection>

    <LegalSection title="Ley aplicable">
      <p>Estos términos se rigen por las leyes de la República del Perú.</p>
    </LegalSection>
  </LegalPage>
)

export default Terminos
