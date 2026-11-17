export type LoginDestination = "/account" | "/admin";
export function authErrorKey(error: { code?: string | undefined; status?: number | undefined }) {
  if (error.code === "invalid_credentials") return "auth_invalid";
  if (error.code === "email_not_confirmed") return "auth_unconfirmed";
  if (error.status === 429) return "auth_rate";
  if (error.code === "weak_password") return "auth_weak";
  if (error.code === "user_already_exists") return "auth_exists";
  return "auth_error";
}
export function rememberLogin(remember: boolean) {
  localStorage.setItem("gold-center-login-session", remember ? "persistent" : "tab");
  sessionStorage.setItem("gold-center-login-tab", "active");
}
export function sessionNeedsSignOut(mode: string | null, tab: string | null) {
  return mode === "tab" && tab !== "active";
}