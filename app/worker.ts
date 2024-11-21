/// <reference path='types.d.ts' />

import { drawFrame, setup } from './draw-frame'
import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

export type Configuration = AudioConfiguration & VideoConfiguration & {
  audioBitrate: number
  numberOfChannels: number
  samplerate: number
  audioStream: ReadableStream<AudioData>
  sharedBuffer: SharedArrayBuffer
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
      codec: 'hevc',
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
    codec: 'hev1.1.6.L150.90',
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
  await Promise.all([
    (async () => {
      if ((await VideoEncoder.isConfigSupported(encoderConfig)).supported)
        encoder.configure(encoderConfig)
      else
        throw new TypeError('This config is not supported')
    })(),
    (async () => {
      if ((await AudioEncoder.isConfigSupported(audioEncoderConfig)).supported)
        audioEncoder.configure(audioEncoderConfig)
      else
        throw new TypeError('This config is not supported')
    })(),
  ])

  const duration = setup(canvas)
  const reader = config.audioStream.getReader()
  for (let isFirst = true, offset = 0; ; isFirst = false) {
    const result = await reader.read()
    if (result.done) break
    const { value: chunk } = result
    if (isFirst) offset = chunk.timestamp
    if (chunk.timestamp - offset > duration) break
    audioEncoder.encode(chunk)
    chunk.close()
  }

  // Convert microseconds to frames
  const frames = duration * BigInt(config.framerate) / BigInt('1000000')
  for (let frameNo = BigInt('0'); frameNo <= frames; frameNo++) {
    const timestamp = Number(frameNo * BigInt('1000000')) / config.framerate
    drawFrame(timestamp)
    const frame = new VideoFrame(canvas, { timestamp })
    encoder.encode(frame)
    frame.close()
  }

  await encoder.flush()
  muxer.finalize()
  self.postMessage(muxer.target.buffer)
}, {once: true})
