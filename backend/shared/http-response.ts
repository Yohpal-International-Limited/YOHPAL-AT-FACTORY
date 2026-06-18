export type ApiResponse<TData> = {
  success: boolean;
  data?: TData;
  error?: string;
  meta?: Record<string, unknown>;
};

export function ok<TData>(data: TData, meta?: Record<string, unknown>): ApiResponse<TData> {
  return {
    success: true,
    data,
    meta,
  };
}

export function fail(error: string): ApiResponse<null> {
  return {
    success: false,
    error,
  };
}
