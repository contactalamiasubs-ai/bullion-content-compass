/** Contact visibility only; product ordering remains a separate workflow. */
export function contactChannels(mode: string | null | undefined) {
  return {
    whatsapp: mode !== "email",
    email: mode !== "whatsapp",
  };
}