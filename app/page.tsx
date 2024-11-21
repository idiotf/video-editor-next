'use client'

import React from 'react'
import getAudioStream from './audio-processor'
import type { Configuration } from './worker'

export default function Home() {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  // const [audioStream, setAudioStream] = React.useState<ReadableStream<AudioData> | null>(null)
  React.useEffect(() => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    const sharedBuffer = new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)
    // const loadingArray = new Uint8Array(sharedBuffer)
    let blobURL = ''
    ;(async () => {
      const configWithoutAudioTrack: Omit<Configuration, 'audioStream'> = {
        width: 3384,
        height: 1440,
        framerate: 60,
        bitrate: 18_000_000, // 18Mbps
        audioBitrate: 192_000, // 192Kbps
        contentType: 'video/mp4',
        samplerate: 48000,
        numberOfChannels: 2,
        sharedBuffer,
      }
      const audioStream = await getAudioStream({
        bitrate: configWithoutAudioTrack.bitrate,
        contentType: configWithoutAudioTrack.contentType,
        samplerate: configWithoutAudioTrack.samplerate,
      })
      const config: Configuration = {
        ...configWithoutAudioTrack,
        audioStream,
      }
      worker.postMessage(config, [audioStream])
      worker.addEventListener('message', ({ data }: MessageEvent<ArrayBuffer>) => {
        const blob = new Blob([data], { type: config.contentType })
        blobURL = URL.createObjectURL(blob)
        if (videoRef.current) videoRef.current.src = blobURL
      })
    })()
    return () => {
      worker.terminate()
      URL.revokeObjectURL(blobURL)
    }
  })
  return (
    <div className='p-8'>
      <video ref={videoRef} controls className='w-1/2 bg-black' />
    </div>
  )
}
