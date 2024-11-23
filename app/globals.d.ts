/**
 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrackProcessor)
 */
interface MediaStreamTrackProcessor {
  readable: ReadableStream<AudioData>
}

// eslint-disable-next-line no-var
declare var MediaStreamTrackProcessor: {
  prototype: MediaStreamTrackProcessor
  new (options: {
    track: MediaStreamTrack
    maxBufferSize?: number
  }): MediaStreamTrackProcessor
  new (track: MediaStreamTrack, bufferSize?: number): MediaStreamTrackProcessor
}
