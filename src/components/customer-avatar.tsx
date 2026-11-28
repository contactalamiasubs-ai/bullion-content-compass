import { useRef, useState } from "react";
import { Camera, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { customerAuth } from "@/lib/customer-client";
import { useShoppingText } from "@/components/shopping-provider";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX = 5 * 1024 * 1024;

/** Gold-ringed customer photo with initial fallback; owners can replace their own photo. */
export function CustomerAvatar({ userId, name, url, onChanged, size = "lg" }: { userId: string; name: string; url: string | null | undefined; onChanged?: () => void; size?: "lg" | "md" }) {
  const text = useShoppingText();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const initial = (name.trim()[0] ?? "؟").toLocaleUpperCase();
  const safe = url && url.startsWith("https://") && !failed ? url : null;
  const upload = async (file: File) => {
    if (!TYPES.includes(file.type) || file.size > MAX) { toast.error(text("welcome_photo_error")); return; }
    setBusy(true);
    try {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const up = await customerAuth.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
      const publicUrl = customerAuth.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      // Profile photo syncs from account details, so the photo stays with the account.
      const saved = await customerAuth.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (saved.error) throw saved.error;
      setFailed(false);
      toast.success(text("welcome_photo_saved"));
      onChanged?.();
    } catch { toast.error(text("welcome_photo_error")); }
    finally { setBusy(false); }
  };
  return <div className={`customer-avatar customer-avatar-${size}`}>
    <div className="customer-avatar-ring">
      {safe ? <img src={safe} alt={name} referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : <span aria-label={name}>{initial}</span>}
    </div>
    <button type="button" className="customer-avatar-edit" disabled={busy} onClick={() => input.current?.click()} aria-label={text("welcome_photo")} title={text("welcome_photo")}>
      {busy ? <LoaderCircle className="animate-spin" /> : <Camera />}
    </button>
    <input ref={input} type="file" accept={TYPES.join(",")} hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
  </div>;
}
