import SingleFileTextTool from '../components/SingleFileTextTool'
import { transcribeAudio } from '../lib/audio'

const AudioATexto = () => (
  <SingleFileTextTool
    title="Audio a texto"
    subtitle="Transcribe notas de voz y grabaciones con IA."
    accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
    dropLabel="Arrastra tu audio aquí o haz click para elegirlo"
    dropHint="MP3, WAV, M4A u OGG. Hasta 20 MB. Se envía a IA para procesarse."
    busyLabel="Transcribiendo"
    run={async (file, onProgress) => ({ text: await transcribeAudio(file, onProgress) })}
  />
)

export default AudioATexto
