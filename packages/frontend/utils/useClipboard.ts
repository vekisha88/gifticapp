import { Clipboard } from "react-native";

export const useClipboard = () => {
  const copyToClipboard = (text: string): void => {
    Clipboard.setString(text);
    // No need for a custom popup. The system should handle feedback natively.
  };

  return { copyToClipboard };
};