/// <reference path='types.d.ts' />

import { drawFrame, setup } from './draw-frame'
import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

export interface Configuration {
  audioBitrate: number
  audioStream: ReadableStream<AudioData>
  bitrate: number
  framerate: number
  samplerate: number
  numberOfChannels: number
  sharedBuffer: SharedArrayBuffer
  contentType: string
  width: number
  height: number
}
// export interface WorkerMsgKeyMap {
//   'config': Configuration
//   'audio-track': MediaStreamTrack
// }
// export interface WorkerMessage<T extends keyof WorkerMsgKeyMap> {
//   eventName: keyof WorkerMsgKeyMap
//   data: WorkerMsgKeyMap[T]
// }

self.addEventListener('message', async ({ data: config }: MessageEvent<Configuration>) => {
  const canvas = new OffscreenCanvas(config.width, config.height)
  const muxer = new Muxer({
    target: new ArrayBufferTarget,
    video: {
      codec: 'vp9',
      width: config.width,
      height: config.height,
      frameRate: config.framerate,
    },
    audio: {
      codec: 'opus',
      numberOfChannels: config.numberOfChannels,
      sampleRate: config.samplerate,
    },
    firstTimestampBehavior: 'offset',
    fastStart: false,
  })
  const encoder = new VideoEncoder({
    output: muxer.addVideoChunk.bind(muxer),
    error(error) { throw error },
  })
  const audioEncoder = new AudioEncoder({
    output: muxer.addAudioChunk.bind(muxer),
    error(error) { throw error },
  })

  const encoderConfig: VideoEncoderConfig = {
    codec: 'vp09.02.10.10.01.09.16.09.01',
    width: config.width,
    height: config.height,
    bitrate: config.bitrate,
    framerate: config.framerate,
  }
  const audioEncoderConfig: AudioEncoderConfig = {
    codec: 'opus',
    bitrate: config.audioBitrate,
    numberOfChannels: config.numberOfChannels,
    sampleRate: config.samplerate,
  }
  encoder.configure(encoderConfig)
  audioEncoder.configure(audioEncoderConfig)

  const loadingArray = new Uint8ClampedArray(config.sharedBuffer)
  const duration = await setup(canvas)
  const reader = config.audioStream.getReader()
  for (let isFirst = true, offset = 0; ; isFirst = false) {
    const result = await reader.read()
    if (result.done) break
    const { value: chunk } = result
    if (isFirst) offset = chunk.timestamp
    if (chunk.timestamp - offset > duration) break
    audioEncoder.encode(chunk)
    chunk.close()
    loadingArray[0] = (chunk.timestamp - offset) * 255 / duration
  }
  loadingArray[1] = 1

  // Convert microseconds to frames
  const frames = duration * config.framerate / 1_000_000
  for (let frameNo = 0; frameNo <= frames; frameNo++) {
    const timestamp = frameNo * 1_000_000 / config.framerate
    drawFrame(timestamp)
    const frame = new VideoFrame(canvas, { timestamp })
    encoder.encode(frame)
    frame.close()
    loadingArray[0] = timestamp * 255 / duration
    await new Promise(resolve => encoder.addEventListener('dequeue', resolve, { once: true }))
  }

  loadingArray[1] = 2
  const queueSize = encoder.encodeQueueSize
  encoder.addEventListener('dequeue', function dequeue() {
    if (loadingArray[1] != 2 || !encoder.encodeQueueSize) return encoder.removeEventListener('dequeue', dequeue)
    loadingArray[0] = (queueSize - encoder.encodeQueueSize) * 255 / queueSize
  })
  await encoder.flush()
  loadingArray[1] = 3
  muxer.finalize()
  encoder.close()
  self.postMessage(muxer.target.buffer, {
    transfer: [ muxer.target.buffer ],
  })
})
