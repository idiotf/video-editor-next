/**
 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrackProcessor)
 */
interface MediaStreamTrackProcessor {
  readable: ReadableStream<AudioData>
}

declare var MediaStreamTrackProcessor: {
  prototype: MediaStreamTrackProcessor
  new (options: {
    track: MediaStreamTrack
    maxBufferSize?: number
  }): MediaStreamTrackProcessor
  new (options: MediaStreamTrack): MediaStreamTrackProcessor
}