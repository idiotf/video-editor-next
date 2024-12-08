import { drawFrame, setup } from '@/app/draw-frame'
import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

export interface Configuration {
  audio?: {
    bitrate: number
    stream: ReadableStream<AudioData>
    samplerate: number
    numberOfChannels: number
  }
  video?: {
    bitrate: number
    framerate: number
    width: number
    height: number
  }
  sharedBuffer: SharedArrayBuffer
  contentType: string
}

export interface DefaultConfiguration {
  audio?: {
    bitrate: number
    samplerate: number
    numberOfChannels: number
  }
  video?: {
    bitrate: number
    framerate: number
    width: number
    height: number
  }
  contentType: string
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
  const canvas = config.video ? new OffscreenCanvas(config.video.width, config.video.height) : null
  const muxer = new Muxer({
    target: new ArrayBufferTarget,
    video: config.video ? {
      codec: 'hevc',
      width: config.video.width,
      height: config.video.height,
      frameRate: config.video.framerate,
    } : undefined,
    audio: config.audio ? {
      codec: 'opus',
      numberOfChannels: config.audio.numberOfChannels,
      sampleRate: config.audio.samplerate,
    } : undefined,
    firstTimestampBehavior: 'offset',
    fastStart: false,
  })
  const videoEncoder: VideoEncoder | null = config.video ? new VideoEncoder({
    output: muxer.addVideoChunk.bind(muxer),
    error(error) { throw error },
  }) : null
  const audioEncoder: AudioEncoder | null = config.audio ? new AudioEncoder({
    output: muxer.addAudioChunk.bind(muxer),
    error(error) { throw error },
  }) : null

  const videoEncoderConfig: VideoEncoderConfig | null = config.video ? {
    codec: 'hev1.1.6.L150.90',
    width: config.video.width,
    height: config.video.height,
    bitrate: config.video.bitrate,
    framerate: config.video.framerate,
  } : null
  const audioEncoderConfig: AudioEncoderConfig | null = config.audio ? {
    codec: 'opus',
    bitrate: config.audio.bitrate,
    numberOfChannels: config.audio.numberOfChannels,
    sampleRate: config.audio.samplerate,
  } : null
  if (videoEncoder && videoEncoderConfig) videoEncoder.configure(videoEncoderConfig)
  if (audioEncoder && audioEncoderConfig) audioEncoder.configure(audioEncoderConfig)

  const loadingArray = new Uint8ClampedArray(config.sharedBuffer)
  const duration = await setup(canvas || new OffscreenCanvas(1, 1))
  if (config.audio && audioEncoder) {
    const reader = config.audio.stream.getReader()
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
  }
  loadingArray[1] = 1
  loadingArray[0] = 0

  if (config.video && videoEncoder && canvas) {
    // Convert microseconds to frames
    const frames = duration * config.video.framerate / 1_000_000
    for (let frameNo = 0; frameNo <= frames; frameNo++) {
      const timestamp = frameNo * 1_000_000 / config.video.framerate
      drawFrame(timestamp)
      const frame = new VideoFrame(canvas, { timestamp })
      videoEncoder.encode(frame)
      frame.close()
      loadingArray[0] = timestamp * 255 / duration
      await new Promise(resolve => videoEncoder.addEventListener('dequeue', resolve, { once: true }))
    }
  }

  loadingArray[1] = 2
  if (videoEncoder) {
    const queueSize = videoEncoder.encodeQueueSize
    videoEncoder.addEventListener('dequeue', function dequeue() {
      if (loadingArray[1] != 2 || !videoEncoder.encodeQueueSize) return videoEncoder.removeEventListener('dequeue', dequeue)
      loadingArray[0] = (queueSize - videoEncoder.encodeQueueSize) * 255 / queueSize
    })
  }
  await videoEncoder?.flush()
  await audioEncoder?.flush()
  loadingArray[1] = 3
  muxer.finalize()
  videoEncoder?.close()
  audioEncoder?.close()
  self.postMessage(muxer.target.buffer, {
    transfer: [ muxer.target.buffer ],
  })
})
