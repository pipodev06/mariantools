import TextAiTool from '../components/TextAiTool'
import { correctText } from '../lib/ai'

const CorrectorOrtografico = () => (
  <TextAiTool
    currentHref="/corrector"
    title="Corrector ortográfico"
    subtitle="Corrige ortografía, gramática y puntuación con IA."
    inputPlaceholder="Pega o escribe el texto a corregir"
    outputLabel="Texto corregido"
    actionLabel="Corregir"
    busyLabel="Corrigiendo..."
    run={correctText}
  />
)

export default CorrectorOrtografico
