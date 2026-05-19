type ApiErrorBody = {
  error?: {
    message?: string;
  };
  message?: string;
};

type HttpErrorLike = {
  response?: {
    data?: ApiErrorBody;
  };
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as HttpErrorLike).response;
    return response?.data?.error?.message ?? response?.data?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};
