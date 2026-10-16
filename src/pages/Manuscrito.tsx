import ImageAiTool from '../components/ImageAiTool'
import { transcribeHandwriting } from '../lib/ai'

const Manuscrito = () => (
  <ImageAiTool<string>
    currentHref="/manuscrito"
    title="Manuscrito a texto"
    subtitle="Reconoce letra a mano en tus imágenes con IA."
    actionLabel="Transcribir"
    busyLabel="Transcribiendo"
    run={transcribeHandwriting}
    toText={(value) => value}
    downloadExt="txt"
  />
)

export default Manuscrito
