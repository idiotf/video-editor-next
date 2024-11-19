'use client'

import React from 'react'

export default function Home() {
  const config: VideoConfiguration = {
    width: 2560,
    height: 1000,
    framerate: 24,
    bitrate: 18_000_000, // 18Mbps
    contentType: '',
  }
  const videoRef = React.useRef<HTMLVideoElement>(null)
  React.useEffect(() => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    // const chunks: AllowSharedBufferSource[] = []
    worker.postMessage(config)
    // worker.addEventListener('message', ({data: {chunk, metadata, done, duration}}: MessageEvent<{chunk: EncodedVideoChunk, metadata?: EncodedVideoChunkMetadata, done?: boolean, duration?: number}>) => {
    //   if (done) {
    //     const blob 
    //   } else {
    //     const buffer = new ArrayBuffer(chunk.byteLength)
    //     chunk.copyTo(buffer)
    //     chunks.push(buffer)
    //   }
    // })
    let blobURL = ''
    worker.addEventListener('message', ({ data }: MessageEvent<ArrayBuffer>) => {
      const blob = new Blob([data], { type: 'video/mp4' })
      blobURL = URL.createObjectURL(blob)
      if (videoRef.current) videoRef.current.src = blobURL
    })
    return () => {
      worker.terminate()
      URL.revokeObjectURL(blobURL)
    }
  })
  return (
    // <svg xmlns='http://www.w3.org/2000/svg' viewBox={`0 0 ${config.width} ${config.height}`}>
    //   <foreignObject width={config.width} height={config.height}>
    //     <video ref={videoRef} controls className={`aspect-[${config.width}/${config.height}]`} width={config.width} height={config.height} />
    //   </foreignObject>
    // </svg>
    <video ref={videoRef} controls className='w-full h-full' />
  )
}
