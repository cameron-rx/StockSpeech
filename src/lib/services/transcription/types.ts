export interface TranscriptionService {
  start(onTranscript: (text: string, isFinal: boolean) => void): Promise<void>
  stop(): void
}
