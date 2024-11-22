export default async function getAudioStream(config: AudioConfiguration) {
  const audioContext = new AudioContext({
    sampleRate: config.samplerate,
  })
  const mediaStreamDestination = new MediaStreamAudioDestinationNode(audioContext)
  const { stream } = mediaStreamDestination
  const [ track ] = stream.getAudioTracks()
  if (!track) throw new TypeError('Audio track is not existing')
  const processor = new MediaStreamTrackProcessor(track)

  const buffer = await audioContext.decodeAudioData(await fetch('DOORS.mp3').then(v => v.arrayBuffer()))
  const bufferSourceNode = new AudioBufferSourceNode(audioContext, {
    buffer,
  })
  bufferSourceNode.connect(mediaStreamDestination)
  bufferSourceNode.start()

  return processor.readable
}
