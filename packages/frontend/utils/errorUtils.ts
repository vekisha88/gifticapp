import axios, { AxiosError } from "axios";

export const formatErrorMessage = (error: unknown | AxiosError, defaultMessage: string): string => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const errorData = error.response.data as { error?: string };
    return errorData.error || defaultMessage;
  }
  return defaultMessage;
};