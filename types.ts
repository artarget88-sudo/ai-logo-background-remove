export enum AppState {
  CHOOSING_FUNCTION,
  IDLE,
  PROCESSING,
  DONE,
  ERROR,
}

export enum ProcessingFunction {
  WATERMARK_REMOVAL,
  BACKGROUND_REMOVAL,
}

export type Quality = 'low' | 'medium' | 'high';

export type ImageStatus = 'queued' | 'processing' | 'done' | 'error';

export interface ImageJob {
  id: string;
  file: File;
  originalUrl: string;
  processedUrl: string | null;
  status: ImageStatus;
  error?: string;
}
