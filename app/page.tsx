'use client'

import React from 'react'
import getAudioStream from './audio-processor'
import type { Configuration } from './worker'

export default function Home() {
  const [worker, setWorker] = React.useState<Worker | null>(null)
  const [blobURL, setBlobURL] = React.useState<string | undefined>(undefined)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const defaultConfig: Omit<Configuration, 'audioStream' | 'sharedBuffer' | 'audioStart'> = {
    width: 3384,
    height: 1440,
    framerate: 24,
    bitrate: 18_000_000, // 18Mbps
    audioBitrate: 192_000, // 192Kbps
    contentType: 'video/mp4',
    samplerate: 44_100, // 44.1kHz
    numberOfChannels: 2,
  }
  const createVideo: React.MouseEventHandler<HTMLButtonElement> = async () => {
    if (!worker) return
    if (buttonRef.current) {
      buttonRef.current.textContent = 'Loading data...'
      buttonRef.current.disabled = true
    }
    const sharedBuffer = new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * 2)
    const loadingArray = new Uint8ClampedArray(sharedBuffer)
    const audioStream = await getAudioStream({
      bitrate: defaultConfig.bitrate,
      contentType: defaultConfig.contentType,
      samplerate: defaultConfig.samplerate,
    })
    if (buttonRef.current) buttonRef.current.textContent = 'Encoding... (0%)'
    const config: Configuration = {
      ...defaultConfig,
      audioStream,
      sharedBuffer,
    }
    const loadingAnimation = requestAnimationFrame(function frame() {
      if (!buttonRef.current?.disabled) return
      switch (loadingArray[1]) {
        case 0:
          buttonRef.current.textContent = `Loading Audio... (${(loadingArray[0] * 100 / 255).toFixed(1)}%)`
          break
        case 1:
          buttonRef.current.textContent = `Loading Video... (${(loadingArray[0] * 100 / 255).toFixed(1)}%)`
          break
        case 2:
          buttonRef.current.textContent = `Encoding... (${(loadingArray[0] * 100 / 255).toFixed(1)}%)`
          break
        case 3:
          buttonRef.current.textContent = 'Finalizing...'
          break
      }
      requestAnimationFrame(frame)
    })
    worker.postMessage(config, [config.audioStream])
    worker.addEventListener('message', ({ data }: MessageEvent<ArrayBuffer>) => {
      if (blobURL) URL.revokeObjectURL(blobURL)
      const blob = new Blob([data], { type: defaultConfig.contentType })
      setBlobURL(URL.createObjectURL(blob))
      cancelAnimationFrame(loadingAnimation)
      if (buttonRef.current) {
        buttonRef.current.textContent = 'Create Video'
        buttonRef.current.disabled = false
      }
    })
  }
  React.useEffect(() => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    setWorker(worker)
  }, [])
  return (
    <div className='p-8'>
      <video src={blobURL} controls className='w-[540px] bg-black bg-gradient-to-r aspect-video' />
      <button ref={buttonRef} onClick={createVideo} className='p-2 border border-gray-800 rounded-md mt-2 bg-zinc-900'>Create Video</button>
    </div>
  )
}
