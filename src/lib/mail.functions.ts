import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { contactNoticeText, mailStatusFlags, noticeAllowed, sendMail } from "@/lib/mail.server";

export const mailStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const allowed = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (allowed.error || !allowed.data) throw new Error("هذه الإعدادات متاحة للمسؤول الكامل فقط.");
    return mailStatusFlags();
  });

export const sendTestMail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const allowed = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (allowed.error || !allowed.data) throw new Error("هذه الإعدادات متاحة للمسؤول الكامل فقط.");
    return sendMail({
      to: mailStatusFlags().to,
      subject: "اختبار بريد جولد سنتر",
      text: "هذه رسالة اختبار من لوحة التحكم. إذا وصلت فإن إعدادات البريد تعمل.",
    });
  });

const noticeInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().max(200),
  phone: z.string().trim().max(40),
  message: z.string().trim().min(1).max(3000),
});

// Public: called right after a contact message is stored. The recipient is the
// owner address from the server environment, never a caller-supplied address.
export const notifyContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => noticeInput.parse(input))
  .handler(async ({ data }) => {
    const flags = mailStatusFlags();
    if (!flags.configured) return { sent: false, reason: "not_configured" };
    if (!noticeAllowed(`contact:${data.email.toLowerCase()}`)) return { sent: false, reason: "too_often" };
    return sendMail({
      to: flags.to,
      subject: `رسالة جديدة من ${data.name}`,
      text: contactNoticeText(data),
    });
  });
