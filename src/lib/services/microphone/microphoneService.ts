import processorUrl from './pcmProcessor.worklet.ts?worker&url'

export class MicrophoneService {
  readonly sampleRate = 16000
  readonly encoding = 'linear16'

  private audioContext: AudioContext | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private workletNode: AudioWorkletNode | null = null
  private stream: MediaStream | null = null

  async start(onChunk: (chunk: Int16Array) => void): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1 },
    })
    await this.startWithStream(stream, onChunk)
  }

  async startWithStream(stream: MediaStream, onChunk: (chunk: Int16Array) => void): Promise<void> {
    this.stream = stream

    this.audioContext = new AudioContext({ sampleRate: this.sampleRate })
    await this.audioContext.audioWorklet.addModule(processorUrl)

    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream)
    this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor')

    this.workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
      const float32 = e.data
      const int16 = new Int16Array(float32.length)
      for (let i = 0; i < float32.length; i++) {
        const clamped = Math.max(-1, Math.min(1, float32[i]))
        int16[i] = clamped < 0 ? clamped * 32768 : clamped * 32767
      }
      onChunk(int16)
    }

    this.sourceNode.connect(this.workletNode)
    this.workletNode.connect(this.audioContext.destination)
  }

  stop(): void {
    this.workletNode?.disconnect()
    this.sourceNode?.disconnect()
    this.workletNode = null
    this.sourceNode = null
    this.audioContext?.close()
    this.audioContext = null
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
  }
}
