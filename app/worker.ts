import { drawFrame, setup } from './draw-frame'
import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

self.addEventListener('message', async ({ data: config }: MessageEvent<VideoConfiguration>) => {
  const canvas = new OffscreenCanvas(config.width, config.height)
  const muxer = new Muxer({
    target: new ArrayBufferTarget,
    video: {
      codec: 'av1',
      width: config.width,
      height: config.height,
      frameRate: config.framerate,
    },
    fastStart: false,
  })
  const encoder = new VideoEncoder({
    output: muxer.addVideoChunk.bind(muxer),
    error(error) { throw error },
  })
  const encoderConfig: VideoEncoderConfig = {
    codec: 'av01.0.12M.08',
    width: config.width,
    height: config.height,
    bitrate: config.bitrate,
  }
  if ((await VideoEncoder.isConfigSupported(encoderConfig)).supported)
    encoder.configure(encoderConfig)
  else
    throw new TypeError('This config is not supported')
  setup(canvas)
  const frames = BigInt(5 * config.framerate)
  for (let frameNo = BigInt('0'); frameNo <= frames; frameNo++) {
    const timestamp = Number(frameNo * BigInt('1000000')) / config.framerate
    drawFrame(timestamp)
    const frame = new VideoFrame(canvas, { timestamp })
    encoder.encode(frame)
    frame.close()
  }
  await encoder.flush()
  // self.postMessage({done: true, duration: Number(frames * BigInt('1000000')) / config.framerate})
  muxer.finalize()
  self.postMessage(muxer.target.buffer)
}, {once: true})
