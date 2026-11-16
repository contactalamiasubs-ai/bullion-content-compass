import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MailPlus, Save, ShieldCheck, ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { permissionKeys, permissionLabels, type Permission } from "@/lib/dashboard-permissions";
import { deleteDashboardUser, inviteDashboardUser, listDashboardUsers, updateDashboardAccess } from "@/lib/users.functions";

const inp = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
function AccessFields({ admin, permissions, onAdmin, onPermissions, disabled = false }: {
  admin: boolean; permissions: string[]; onAdmin: (value: boolean) => void;
  onPermissions: (value: Permission[]) => void; disabled?: boolean;
}) {
  return <div className="space-y-4">
    <label className="flex items-center gap-3 text-sm"><Switch checked={admin} onCheckedChange={onAdmin} disabled={disabled} aria-label="مسؤول كامل الصلاحيات" /><ShieldCheck className="h-4 w-4 text-gold" />مسؤول كامل الصلاحيات</label>
    {!admin && <div className="grid gap-3 sm:grid-cols-2">
      {permissionKeys.map((key) => <label key={key} className="flex items-start gap-3 text-sm">
        <Switch checked={permissions.includes(key)} disabled={disabled} aria-label={permissionLabels[key]}
          onCheckedChange={(checked) => onPermissions(permissionKeys.filter((item) => item === key ? checked : permissions.includes(item)))} />
        <span>{permissionLabels[key]}</span>
      </label>)}
    </div>}
  </div>;
}
type Account = Awaited<ReturnType<typeof listDashboardUsers>>["users"][number];
function AccountRow({ account, actorId, onSaved }: { account: Account; actorId: string; onSaved: () => void }) {
  const update = useServerFn(updateDashboardAccess);
  const remove = useServerFn(deleteDashboardUser);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [admin, setAdmin] = useState(account.admin);
  const [permissions, setPermissions] = useState<Permission[]>(permissionKeys.filter((key) => account.permissions.includes(key)));
  const [busy, setBusy] = useState(false);
  const self = actorId === account.id;
  return <article className="space-y-4 rounded-lg border border-border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 dir="ltr" className="break-all font-medium">{account.email}{self && <span className="ms-2 text-xs text-gold">(حسابك)</span>}</h3>
      <span className="text-xs text-muted-foreground">{account.confirmed ? "حساب مفعّل" : "بانتظار قبول الدعوة أو تأكيد البريد"}</span>
    </div>
    <AccessFields admin={admin} permissions={permissions} onAdmin={setAdmin} onPermissions={setPermissions} disabled={busy || self} />
    <div className="flex flex-wrap items-center gap-3"><Button disabled={busy || self} onClick={async () => {
      setBusy(true);
      try { await update({ data: { userId: account.id, admin, permissions } }); toast.success("تم حفظ الصلاحيات"); onSaved(); }
      catch (error) { toast.error(error instanceof Error ? error.message : "تعذر الحفظ"); }
      finally { setBusy(false); }
    }}><Save />{busy ? "جارٍ الحفظ…" : "حفظ الصلاحيات"}</Button>
    <AlertDialog open={confirmDelete} onOpenChange={(open) => { if (!busy) setConfirmDelete(open); }}>
      <AlertDialogTrigger asChild><Button variant="destructive" disabled={busy || self}><Trash2 />حذف المستخدم</Button></AlertDialogTrigger>
      <AlertDialogContent dir="rtl" className="max-w-[calc(100%-2rem)] sm:max-w-lg">
        <AlertDialogTitle>حذف المستخدم نهائيًا؟</AlertDialogTitle>
        <AlertDialogDescription>سيُحذف حساب <span dir="ltr" className="break-all">{account.email}</span> وصلاحياته، ولن يتمكن من تسجيل الدخول بهذا الحساب. لا يمكن التراجع عن الحذف.</AlertDialogDescription>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={busy}>إلغاء</AlertDialogCancel>
          <Button variant="destructive" disabled={busy} onClick={async () => {
            setBusy(true);
            try { await remove({ data: { userId: account.id } }); setConfirmDelete(false); toast.success("تم حذف المستخدم وصلاحياته"); onSaved(); }
            catch (error) { toast.error(error instanceof Error ? error.message : "تعذر حذف المستخدم"); }
            finally { setBusy(false); }
          }}><Trash2 />{busy ? "جارٍ الحذف…" : "تأكيد الحذف"}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog></div>
  </article>;
}

export function Users({ actorId }: { actorId: string }) {
  const list = useServerFn(listDashboardUsers);
  const invite = useServerFn(inviteDashboardUser);
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [admin, setAdmin] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [busy, setBusy] = useState(false);
  const query = useQuery({ queryKey: ["dashboard-users", page], queryFn: () => list({ data: { page } }) });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["dashboard-users"] }); void qc.invalidateQueries({ queryKey: ["dashboard-access"] }); };
  return <div className="space-y-8">
    <form className="space-y-4 border-b border-border pb-6" onSubmit={async (event) => {
      event.preventDefault(); setBusy(true);
      try { await invite({ data: { email, admin, permissions } }); toast.success("تم إرسال دعوة بالبريد وحفظ الصلاحيات"); setEmail(""); refresh(); }
      catch (error) { toast.error(error instanceof Error ? error.message : "تعذر إرسال الدعوة"); refresh(); }
      finally { setBusy(false); }
    }}>
      <h3 className="text-lg">إضافة مستخدم أو مسؤول</h3>
      <label className="block space-y-2 text-sm"><span>البريد الإلكتروني</span><input aria-label="بريد المستخدم الجديد" className={inp} dir="ltr" type="email" maxLength={255} required value={email} disabled={busy} onChange={(event) => setEmail(event.target.value)} /></label>
      <AccessFields admin={admin} permissions={permissions} onAdmin={setAdmin} onPermissions={setPermissions} disabled={busy} />
      <Button type="submit" disabled={busy}><MailPlus />{busy ? "جارٍ إرسال الدعوة…" : "إرسال دعوة"}</Button>
    </form>
    <div className="space-y-4">
      <div className="relative"><Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" /><input aria-label="البحث في مستخدمي الصفحة" placeholder="بحث بالبريد الإلكتروني…" className={`${inp} ps-9`} value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      {query.isLoading && <p>جارٍ تحميل المستخدمين…</p>}
      {query.error && <p role="alert" className="text-destructive">{query.error.message}</p>}
      {query.data?.users.filter((account) => account.email.toLowerCase().includes(search.toLowerCase())).map((account) => <AccountRow key={`${account.id}:${account.admin}:${account.permissions.join(",")}`} account={account} actorId={actorId} onSaved={refresh} />)}
      {query.data && !query.data.users.some((account) => account.email.toLowerCase().includes(search.toLowerCase())) && <p className="text-muted-foreground">لا توجد حسابات مطابقة في هذه الصفحة.</p>}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" aria-label="الصفحة السابقة" disabled={page === 1 || query.isFetching} onClick={() => setPage(page - 1)}><ChevronRight /></Button>
        <span className="text-sm">الصفحة {page}</span>
        <Button variant="outline" size="icon" aria-label="الصفحة التالية" disabled={!query.data?.hasNext || query.isFetching} onClick={() => setPage(page + 1)}><ChevronLeft /></Button>
      </div>
    </div>
  </div>;
}