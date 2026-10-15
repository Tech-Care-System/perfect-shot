export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export type WorkerErrorType = 'LOAD_ERROR' | 'RUNTIME_ERROR' | 'UNKNOWN_ERROR';

export interface WorkerErrorDetail {
  type: WorkerErrorType;
  rawError: unknown;
}

