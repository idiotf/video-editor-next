import type { AudioConfig } from '@/app/worker'

export default async function getAudioStream(config: Omit<AudioConfig, 'stream'>) {
  // const audioContext = new AudioContext({
  //   sampleRate: config.samplerate,
  // })
  // const mediaStreamDestination = new MediaStreamAudioDestinationNode(audioContext)
  // const { stream } = mediaStreamDestination
  // const [ track ] = stream.getAudioTracks()
  // if (!track) throw new TypeError('Audio track is not existing')
  // const processor = new MediaStreamTrackProcessor(track)

  // const buffer = await audioContext.decodeAudioData(await fetch('DOORS.mp3').then(v => v.arrayBuffer()))
  // const bufferSourceNode = new AudioBufferSourceNode(audioContext, {
  //   buffer,
  // })
  // bufferSourceNode.connect(mediaStreamDestination)

  // let reader: ReadableStreamDefaultReader<AudioData>
  // return new ReadableStream<AudioData>({
  //   pull(controller) {
  //     if (reader) return
  //     reader = processor.readable.getReader()
  //     start()
  //     ;(async () => {
  //       for (;;) {
  //         const chunk = await reader.read()
  //         if (chunk.done) return
  //         controller.enqueue(chunk.value)
  //       }
  //     })()
  //   },
  // })
  const notes = [
    384.87,
    384.87,
    432,
    432,
  ]
  let time = 0
  return new ReadableStream<AudioData>({
    pull(controller) {
      const sampleRate = config.samplerate
      const duration = 0.125
      const timestamp = duration * time * 1_000_000
      const { numberOfChannels } = config
      const data = new AudioData({
        format: 'f32-planar',
        sampleRate,
        numberOfChannels,
        numberOfFrames: sampleRate * duration,
        timestamp,
        data: new Float32Array(sampleRate * numberOfChannels * duration).map((v, i) => {
          const sampleNo = Math.floor(i / duration / sampleRate)
          const time = timestamp / 1_000_000 + (i / sampleRate - duration * sampleNo)
          const frequency = notes[Math.floor(time / 0.5)]
          return Math.sin(time * frequency * Math.PI * 2) * (sampleNo == Math.floor(time / 0.5 % 2) ? 1 : 0)
        }),
      })
      controller.enqueue(data)
      time++
    },
  })
}
