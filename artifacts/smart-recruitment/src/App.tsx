import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  Clock3,
  FilePlus2,
  LayoutDashboard,
  Loader2,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import {
  getGetDashboardSummaryQueryKey,
  getGetJobQueryKey,
  getHealthCheckQueryKey,
  getListJobApplicationsQueryKey,
  getListJobsQueryKey,
  useCreateApplication,
  useCreateJob,
  useGetDashboardSummary,
  useGetJob,
  useHealthCheck,
  useListJobApplications,
  useListJobs,
} from '@workspace/api-client-react';
import type { Application, Job } from '@workspace/api-client-react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(value),
      )
    : '—';

const statusLabel: Record<string, string> = {
  qualified: 'مطابق للمتطلبات',
  reviewing: 'قيد المراجعة',
  not_qualified: 'غير مطابق',
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' | 'outline' | 'danger' }) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-primary text-primary-foreground shadow-[0_4px_0_hsl(39_86%_36%)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_hsl(39_86%_36%)] active:translate-y-0 active:shadow-[0_2px_0_hsl(39_86%_36%)]',
        variant === 'quiet' && 'bg-secondary text-secondary-foreground hover:bg-muted',
        variant === 'outline' && 'border border-border bg-card text-foreground hover:border-primary hover:text-primary',
        variant === 'danger' && 'border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground',
        className,
      )}
    />
  );
}

function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between text-sm font-semibold text-foreground">
        {label}
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
      <input
        {...props}
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
    </label>
  );
}

function TextArea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <textarea
        {...props}
        className="min-h-28 w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm leading-7 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
    </label>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" data-testid="link-logo">
      <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_3px_0_hsl(39_86%_36%)]">
        <ShieldCheck className="size-5" strokeWidth={2.5} />
      </span>
      <span>
        <strong className="font-display block text-lg leading-none tracking-tight">مسار</strong>
        <span className="mt-1 block text-[10px] font-medium tracking-[0.18em] text-sidebar-foreground/60">مساحة توظيف</span>
      </span>
    </Link>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), retry: false } });
  const isEmployer = location.startsWith('/employer');
  const navItems = [
    { href: '/', label: 'نظرة عامة', icon: LayoutDashboard },
    { href: '/employer', label: 'مساحة صاحب العمل', icon: BriefcaseBusiness },
    { href: '/applicant', label: 'استكشف الفرص', icon: Search },
  ];

  return (
    <div className="app-shell min-h-[100dvh]">
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-30 flex w-[272px] flex-col border-l border-sidebar-border bg-sidebar px-5 py-6 text-sidebar-foreground transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button className="rounded-md p-2 text-sidebar-foreground/70 lg:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-menu">
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-10">
          <p className="px-3 text-[11px] font-bold tracking-[0.16em] text-sidebar-foreground/45">مساحات العمل</p>
          <nav className="mt-3 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                data-testid={`link-nav-${href === '/' ? 'home' : href.slice(1)}`}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  (href === '/' ? location === '/' : location.startsWith(href)) && 'bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_3px_0_hsl(39_86%_48%/.45)]',
                )}
              >
                <Icon className="size-[18px]" />
                {label}
                {href === '/employer' && <ArrowLeft className="mr-auto size-4 opacity-50" />}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sidebar-foreground/65">حالة الخدمة</span>
            <span className={cn('size-2 rounded-full', health.isError ? 'bg-destructive' : health.isLoading ? 'animate-pulse-soft bg-primary' : 'bg-emerald-400')} />
          </div>
          <p className="mt-2 text-sm font-semibold">{health.isError ? 'تحتاج إلى انتباه' : health.isLoading ? 'جار الفحص…' : 'كل شيء يعمل'}</p>
          <p className="mt-1 text-xs leading-5 text-sidebar-foreground/55">بيانات التوظيف محمية ومزامنة.</p>
        </div>
        <div className="mt-4 border-t border-sidebar-border pt-4 text-xs text-sidebar-foreground/45">مسار · وضوح في كل قرار</div>
      </aside>
      {mobileOpen && <button aria-label="إغلاق القائمة" className="fixed inset-0 z-20 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} data-testid="button-overlay-menu" />}
      <main className="min-h-[100dvh] lg:mr-[272px]">
        <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/85 px-5 backdrop-blur-md sm:px-8">
          <button className="rounded-lg border border-border bg-card p-2 text-muted-foreground lg:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-menu">
            <Menu className="size-5" />
          </button>
          <div className="hidden text-sm text-muted-foreground lg:block">
            {isEmployer ? 'تركيز اليوم: اختيار المرشح المناسب' : 'الخطوة التالية قد تبدأ هنا'}
          </div>
          <div className="mr-auto flex items-center gap-3 lg:mr-0">
            <span className="hidden text-xs text-muted-foreground sm:block">آخر مزامنة منذ لحظات</span>
            <span className="grid size-9 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent">م</span>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="animate-rise flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.13em] text-primary"><span className="size-1.5 rounded-full bg-primary" />{eyebrow}</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function LoadingCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-3" aria-label="جار التحميل" data-testid="loading-state">
      {Array.from({ length: count }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-xl border border-border bg-card/80" />)}
    </div>
  );
}

function ErrorState({ message = 'تعذر تحميل البيانات الآن.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-6 text-center" data-testid="error-state">
      <XCircle className="mx-auto size-7 text-destructive" />
      <p className="mt-3 text-sm font-semibold">{message}</p>
      {onRetry && <Button variant="outline" className="mt-4" onClick={onRetry} data-testid="button-retry"><RefreshCw className="size-4" />حاول مجدداً</Button>}
    </div>
  );
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-border bg-card/50 p-8 text-center" data-testid="empty-state">
      <div>
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><ClipboardCheck className="size-6" /></div>
        <p className="mt-4 font-semibold">{title}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
        {action}
      </div>
    </div>
  );
}

function StatCard({ label, value, note, icon: Icon, accent }: { label: string; value: number | string; note: string; icon: typeof Users; accent?: string }) {
  return (
    <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" data-testid={`stat-${label}`}>
      <div className="flex items-start justify-between">
        <span className={cn('grid size-10 place-items-center rounded-lg bg-primary/10 text-primary', accent)}><Icon className="size-5" /></span>
        <ArrowUpRight className="size-4 text-muted-foreground/60 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <p className="mt-5 font-display text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function Home() {
  const [, setLocation] = useLocation();
  const summary = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey(), retry: 1 } });
  const jobs = useListJobs({ query: { queryKey: getListJobsQueryKey(), retry: 1 } });

  return (
    <div className="space-y-8">
      <section className="animate-rise relative overflow-hidden rounded-2xl bg-sidebar px-6 py-8 text-sidebar-foreground shadow-xl sm:px-10 sm:py-10">
        <div className="absolute -left-16 -top-20 size-64 rounded-full border-[28px] border-primary/15" />
        <div className="absolute bottom-[-100px] right-[32%] size-72 rounded-full border-[44px] border-accent/10" />
        <div className="relative max-w-3xl">
          <p className="mb-5 flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-primary"><Sparkles className="size-4" />مسار التوظيف الذكي</p>
          <h1 className="max-w-2xl font-display text-3xl font-bold leading-[1.3] tracking-tight sm:text-5xl">من متطلب بسيط،<br /><span className="text-primary">إلى قرار أوضح.</span></h1>
          <p className="mt-5 max-w-xl text-sm leading-8 text-sidebar-foreground/70 sm:text-base">مساحة عمل مركّزة تساعدك على نشر الفرص، فهم المتطلبات، واتخاذ الخطوة التالية بثقة — دون جداول متداخلة.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => setLocation('/employer')} data-testid="button-start-employer"><BriefcaseBusiness className="size-4" />أنا صاحب عمل</Button>
            <Button variant="outline" className="border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:border-primary hover:text-primary" onClick={() => setLocation('/applicant')} data-testid="button-start-applicant"><Search className="size-4" />أبحث عن فرصة</Button>
          </div>
        </div>
        <div className="relative mt-10 grid max-w-2xl grid-cols-2 gap-3 border-t border-sidebar-border pt-5 sm:flex sm:gap-10">
          <div><p className="font-display text-2xl font-bold text-primary">{summary.data?.jobCount ?? '—'}</p><p className="mt-1 text-xs text-sidebar-foreground/55">فرص منشورة</p></div>
          <div><p className="font-display text-2xl font-bold text-primary">{summary.data?.qualifiedCount ?? '—'}</p><p className="mt-1 text-xs text-sidebar-foreground/55">مرشحون مطابقون</p></div>
          <div><p className="font-display text-2xl font-bold text-primary">{summary.data?.applicationCount ?? '—'}</p><p className="mt-1 text-xs text-sidebar-foreground/55">طلب قيد المتابعة</p></div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div><p className="text-xs font-bold tracking-[0.12em] text-primary">لوحة سريعة</p><h2 className="mt-1 text-xl font-bold">صورة التوظيف الآن</h2></div>
          <span className="text-xs text-muted-foreground">تتجدد تلقائياً</span>
        </div>
        {summary.isLoading ? <LoadingCards /> : summary.isError ? <ErrorState onRetry={() => summary.refetch()} /> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="الفرص المنشورة" value={summary.data?.jobCount ?? 0} note="إعلانات نشطة في المساحة" icon={BriefcaseBusiness} />
            <StatCard label="إجمالي الطلبات" value={summary.data?.applicationCount ?? 0} note="كل الطلبات المستلمة" icon={Users} accent="bg-accent/15 text-accent" />
            <StatCard label="مطابقون للمتطلبات" value={summary.data?.qualifiedCount ?? 0} note="حسب الخبرة والمهارة" icon={CheckCircle2} accent="bg-emerald-500/10 text-emerald-700" />
            <StatCard label="فرص متاحة الآن" value={jobs.data?.length ?? 0} note="يمكنك التقديم عليها" icon={Clock3} accent="bg-sky-500/10 text-sky-700" />
          </div>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_.9fr]">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold tracking-[0.12em] text-primary">آخر الحركة</p><h2 className="mt-1 text-lg font-bold">طلبات وصلت مؤخراً</h2></div><Link href="/employer" className="flex items-center gap-1 text-xs font-bold text-primary" data-testid="link-see-applications">عرض المساحة <ChevronLeft className="size-4" /></Link></div>
          {summary.isLoading ? <div className="mt-5 space-y-3"><div className="h-14 animate-pulse rounded-lg bg-muted" /><div className="h-14 animate-pulse rounded-lg bg-muted" /></div> : summary.data?.recentApplications?.length ? <div className="mt-5 space-y-2">{summary.data.recentApplications.slice(0, 4).map((application) => <ApplicationRow key={application.id} application={application} />)}</div> : <div className="mt-5"><EmptyState title="لا توجد طلبات بعد" description="عندما يتقدم أول مرشح، ستظهر التفاصيل هنا." /></div>}
        </div>
        <div className="grid-paper rounded-xl border border-border bg-card p-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></div>
          <h2 className="mt-6 text-xl font-bold leading-8">الوضوح ليس خطوة إضافية.<br /><span className="text-primary">هو نقطة البداية.</span></h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">كل طلب يمر على نفس المعايير المعلنة. نتيجة أسهل للفهم، وتجربة أعدل للجميع.</p>
          <Link href="/applicant" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary" data-testid="link-explore-opportunities">استكشف الفرص <ArrowLeft className="size-4" /></Link>
        </div>
      </section>
    </div>
  );
}

function ApplicationRow({ application }: { application: Application }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/55 p-3" data-testid={`row-application-${application.id}`}>
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent">{application.applicantName.trim().slice(0, 1)}</div>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold" data-testid={`text-applicant-${application.id}`}>{application.applicantName}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{application.skill} · {application.experience} سنوات خبرة</p></div>
      <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold', application.qualified ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground')} data-testid={`status-application-${application.id}`}>{application.qualified ? 'مطابق' : statusLabel[application.status] ?? 'قيد المراجعة'}</span>
    </div>
  );
}

function Employer() {
  const client = useQueryClient();
  const jobs = useListJobs({ query: { queryKey: getListJobsQueryKey(), retry: 1 } });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ title: '', minExperience: '2', skill: '', description: '' });
  const createJob = useCreateJob();
  const activeId = selectedId ?? jobs.data?.[0]?.id ?? 0;
  const detail = useGetJob(activeId, { query: { enabled: Boolean(activeId), queryKey: getGetJobQueryKey(activeId), retry: 1 } });
  const applications = useListJobApplications(activeId, { query: { enabled: Boolean(activeId), queryKey: getListJobApplicationsQueryKey(activeId), retry: 1 } });

  const submitJob = (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    createJob.mutate({ data: { title: form.title.trim(), minExperience: Number(form.minExperience), skill: form.skill.trim(), description: form.description.trim() } }, {
      onSuccess: (job) => {
        setForm({ title: '', minExperience: '2', skill: '', description: '' });
        setSelectedId(job.id);
        setNotice({ type: 'success', text: 'تم نشر الفرصة بنجاح. يمكنك الآن مراجعة الطلبات.' });
        client.invalidateQueries({ queryKey: getListJobsQueryKey() });
        client.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
      onError: () => setNotice({ type: 'error', text: 'لم نتمكن من نشر الفرصة. تحقق من البيانات وحاول مجدداً.' }),
    });
  };

  return (
    <div className="space-y-8">
      <PageHeading eyebrow="مساحة صاحب العمل" title="حوّل الاحتياج إلى فرصة واضحة" description="اكتب المتطلبات كما هي، وسيتولى مسار ترتيب الصورة أمامك وأمام المرشحين." action={<Link href="/applicant" className="inline-flex items-center gap-2 text-sm font-bold text-primary" data-testid="link-switch-applicant"><Search className="size-4" />عرض تجربة المتقدم</Link>} />
      {notice && <div className={cn('flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold animate-rise', notice.type === 'success' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-800' : 'border-destructive/25 bg-destructive/10 text-destructive')} data-testid="status-employer-notice">{notice.type === 'success' ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}{notice.text}<button className="mr-auto opacity-60 hover:opacity-100" onClick={() => setNotice(null)} data-testid="button-dismiss-notice"><X className="size-4" /></button></div>}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(320px,.75fr)_minmax(520px,1.5fr)]">
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><FilePlus2 className="size-5" /></span><div><h2 className="font-bold">نشر فرصة جديدة</h2><p className="text-xs text-muted-foreground">المتطلبات الأساسية فقط</p></div></div>
          <form className="mt-6 space-y-4" onSubmit={submitJob}>
            <Field label="المسمى الوظيفي" placeholder="مثال: مهندس منتجات" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="input-job-title" />
            <div className="grid grid-cols-2 gap-3"><Field type="number" min="0" label="الخبرة الدنيا" hint="سنوات" value={form.minExperience} onChange={(e) => setForm({ ...form, minExperience: e.target.value })} required data-testid="input-job-experience" /><Field label="المهارة الأساسية" placeholder="مثال: Figma" value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} required data-testid="input-job-skill" /></div>
            <TextArea label="وصف مختصر" placeholder="ما الذي سيعمل عليه المرشح؟" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-job-description" />
            <Button type="submit" className="w-full" disabled={createJob.isPending || !form.title.trim() || !form.skill.trim()} data-testid="button-publish-job">{createJob.isPending ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />} {createJob.isPending ? 'جار النشر…' : 'نشر الفرصة'}</Button>
          </form>
        </section>
        <section className="min-w-0 rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-bold tracking-[0.12em] text-primary">مراجعة الطلبات</p><h2 className="mt-1 text-xl font-bold">اختر فرصة للبدء</h2></div><div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground"><span className="size-2 rounded-full bg-primary" />{jobs.data?.length ?? 0} فرص</div></div>
          {jobs.isLoading ? <div className="mt-5"><LoadingCards count={2} /></div> : jobs.isError ? <div className="mt-5"><ErrorState onRetry={() => jobs.refetch()} /></div> : !jobs.data?.length ? <div className="mt-5"><EmptyState title="مساحتك جاهزة لفرصتك الأولى" description="ابدأ بكتابة المسمى والمهارة الأساسية، وستظهر الفرصة هنا بعد النشر." /></div> : <div className="mt-6 grid gap-5 lg:grid-cols-[220px_1fr]">
            <div className="space-y-2">{jobs.data.map((job) => <button key={job.id} onClick={() => setSelectedId(job.id)} className={cn('w-full rounded-lg border p-3 text-right transition', activeId === job.id ? 'border-primary bg-primary/8 shadow-sm' : 'border-border hover:border-primary/50')} data-testid={`button-select-job-${job.id}`}><p className="truncate text-sm font-bold">{job.title}</p><p className="mt-1 text-xs text-muted-foreground">{job.applicationCount} طلب · {job.skill}</p></button>)}</div>
            <div className="min-w-0">{detail.isLoading ? <LoadingCards count={1} /> : detail.isError ? <ErrorState message="تعذر تحميل تفاصيل الفرصة." onRetry={() => detail.refetch()} /> : detail.data ? <JobReview job={detail.data} applications={{ data: applications.data as Application[] | undefined, isLoading: applications.isLoading, isError: applications.isError, refetch: applications.refetch }} /> : null}</div>
          </div>}
        </section>
      </div>
    </div>
  );
}

function JobReview({ job, applications }: { job: Job; applications: { data?: Application[]; isLoading: boolean; isError: boolean; refetch: () => unknown } }) {
  return (
    <div>
      <div className="rounded-xl bg-sidebar p-5 text-sidebar-foreground"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-sidebar-foreground/55">الفرصة المحددة</p><h3 className="mt-1 text-xl font-bold">{job.title}</h3></div><span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">{job.applicationCount} طلب</span></div><p className="mt-3 text-sm leading-7 text-sidebar-foreground/65">{job.description || 'لم تتم إضافة وصف لهذه الفرصة.'}</p><div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-md bg-sidebar-accent px-2.5 py-1.5">{job.skill}</span><span className="rounded-md bg-sidebar-accent px-2.5 py-1.5">{job.minExperience}+ سنوات خبرة</span></div></div>
      <div className="mt-6 flex items-center justify-between"><div><h3 className="font-bold">المرشحون</h3><p className="mt-1 text-xs text-muted-foreground">مطابقة أولية حسب معايير الفرصة</p></div><span className="text-xs text-muted-foreground">{applications.data?.length ?? 0} إجمالي</span></div>
      {applications.isLoading ? <div className="mt-4"><LoadingCards count={2} /></div> : applications.isError ? <div className="mt-4"><ErrorState onRetry={() => applications.refetch()} /></div> : !applications.data?.length ? <div className="mt-4"><EmptyState title="لم تصل طلبات بعد" description="شارك الفرصة مع المرشحين المناسبين، وستظهر طلباتهم هنا." /></div> : <div className="mt-4 space-y-2">{applications.data.map((application) => <ApplicationRow key={application.id} application={application} />)}</div>}
    </div>
  );
}

function Applicant() {
  const jobs = useListJobs({ query: { queryKey: getListJobsQueryKey(), retry: 1 } });
  const [search, setSearch] = useState('');
  const filteredJobs = useMemo(() => jobs.data?.filter((job) => `${job.title} ${job.skill}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())) ?? [], [jobs.data, search]);
  return (
    <div className="space-y-8">
      <PageHeading eyebrow="استكشاف الفرص" title="فرصة مناسبة تبدأ بفهم واضح" description="استعرض المتطلبات كما كتبها صاحب العمل، ثم قدّم خبرتك بصدق وبأقل عدد من الخطوات." action={<Link href="/employer" className="inline-flex items-center gap-2 text-sm font-bold text-primary" data-testid="link-switch-employer"><BriefcaseBusiness className="size-4" />أنا صاحب عمل</Link>} />
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="h-11 w-full rounded-lg border border-input bg-background pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="ابحث بالمسمى أو المهارة" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-jobs" /></div><span className="flex items-center px-2 text-xs font-semibold text-muted-foreground">{filteredJobs.length} فرص متاحة</span></div>
      {jobs.isLoading ? <LoadingCards count={3} /> : jobs.isError ? <ErrorState onRetry={() => jobs.refetch()} /> : !filteredJobs.length ? <EmptyState title={search ? 'لا توجد نتائج مطابقة' : 'لا توجد فرص متاحة حالياً'} description={search ? 'جرّب مصطلحاً آخر أو امسح البحث.' : 'عد لاحقاً، الفرص الجديدة تظهر فور نشرها.'} action={search ? <Button variant="quiet" className="mt-4" onClick={() => setSearch('')} data-testid="button-clear-search">مسح البحث</Button> : undefined} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredJobs.map((job, index) => <JobCard key={job.id} job={job} featured={index === 0} />)}</div>}
    </div>
  );
}

function JobCard({ job, featured }: { job: Job; featured?: boolean }) {
  return (
    <Link href={`/job/${job.id}`} className={cn('group flex min-h-64 flex-col rounded-xl border bg-card p-5 transition duration-200 hover:-translate-y-1 hover:shadow-lg', featured ? 'border-primary/50 shadow-[inset_0_3px_0_hsl(39_86%_48%)]' : 'border-border')} data-testid={`card-job-${job.id}`}>
      <div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><BriefcaseBusiness className="size-5" /></span><ArrowUpRight className="size-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" /></div>
      {featured && <span className="mt-4 w-fit rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">أحدث فرصة</span>}
      <h3 className="mt-3 text-lg font-bold">{job.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{job.description || 'فرصة جديدة بمتطلبات واضحة وخطوة تالية مباشرة.'}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-5 text-xs font-semibold"><span className="rounded-md bg-muted px-2.5 py-1.5">{job.skill}</span><span className="rounded-md bg-muted px-2.5 py-1.5">{job.minExperience}+ سنوات</span></div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground"><span>{formatDate(job.createdAt)}</span><span className="font-bold text-primary">عرض التفاصيل <ChevronLeft className="inline size-3" /></span></div>
    </Link>
  );
}

function JobDetail() {
  const params = useParams<{ id: string }>();
  const jobId = Number(params.id);
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const detail = useGetJob(jobId, { query: { enabled: Number.isFinite(jobId), queryKey: getGetJobQueryKey(jobId), retry: 1 } });
  const createApplication = useCreateApplication();
  const [form, setForm] = useState({ applicantName: '', experience: '1', skill: '' });
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const submitApplication = (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    createApplication.mutate({ jobId, data: { applicantName: form.applicantName.trim(), experience: Number(form.experience), skill: form.skill.trim() } }, {
      onSuccess: () => {
        setForm({ applicantName: '', experience: '1', skill: '' });
        setNotice({ type: 'success', text: 'تم إرسال طلبك. سيظهر لصاحب العمل وفقاً للمتطلبات المعلنة.' });
        client.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });
        client.invalidateQueries({ queryKey: getListJobApplicationsQueryKey(jobId) });
        client.invalidateQueries({ queryKey: getListJobsQueryKey() });
        client.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
      onError: () => setNotice({ type: 'error', text: 'تعذر إرسال الطلب الآن. تحقق من البيانات وحاول مجدداً.' }),
    });
  };

  if (detail.isLoading) return <div className="space-y-6"><div className="h-7 w-24 animate-pulse rounded bg-muted" /><LoadingCards count={2} /></div>;
  if (detail.isError || !detail.data) return <ErrorState message="لم نتمكن من العثور على هذه الفرصة." onRetry={() => detail.refetch()} />;
  const job = detail.data;
  return (
    <div className="space-y-7">
      <button onClick={() => setLocation('/applicant')} className="flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-primary" data-testid="button-back-jobs"><ArrowRightIcon />العودة إلى الفرص</button>
      <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-2xl bg-sidebar p-6 text-sidebar-foreground shadow-xl sm:p-9"><div className="flex items-start justify-between gap-5"><div className="grid size-14 place-items-center rounded-xl bg-primary text-primary-foreground"><BriefcaseBusiness className="size-7" /></div><span className="rounded-full border border-sidebar-border px-3 py-1 text-xs text-sidebar-foreground/60">نشرت في {formatDate(job.createdAt)}</span></div><p className="mt-10 text-xs font-bold tracking-[0.14em] text-primary">فرصة متاحة</p><h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-5xl">{job.title}</h1><p className="mt-5 max-w-2xl text-sm leading-8 text-sidebar-foreground/70">{job.description || 'نبحث عن شخص يضيف قيمة حقيقية إلى الفريق. تعرّف على المتطلبات وقدّم خبرتك كما هي.'}</p><div className="mt-8 grid grid-cols-2 gap-3 border-t border-sidebar-border pt-6"><div><p className="text-xs text-sidebar-foreground/50">المهارة الأساسية</p><p className="mt-2 font-bold text-primary">{job.skill}</p></div><div><p className="text-xs text-sidebar-foreground/50">الخبرة المطلوبة</p><p className="mt-2 font-bold">{job.minExperience}+ سنوات</p></div></div></section>
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><ClipboardCheck className="size-5" /></span><div><h2 className="font-bold">قدّم اهتمامك</h2><p className="text-xs text-muted-foreground">خطوة واحدة، دون سيرة طويلة</p></div></div>{notice && <div className={cn('mt-5 flex gap-2 rounded-lg border p-3 text-xs font-semibold leading-5', notice.type === 'success' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-800' : 'border-destructive/25 bg-destructive/10 text-destructive')} data-testid="status-application-notice">{notice.type === 'success' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}{notice.text}</div>}<form className="mt-6 space-y-4" onSubmit={submitApplication}><Field label="الاسم الكامل" placeholder="كيف نناديك؟" value={form.applicantName} onChange={(e) => setForm({ ...form, applicantName: e.target.value })} required data-testid="input-applicant-name" /><Field type="number" min="0" label="سنوات الخبرة" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} required data-testid="input-applicant-experience" /><Field label="المهارة الأساسية لديك" placeholder={job.skill} value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} required data-testid="input-applicant-skill" /><Button type="submit" className="mt-2 w-full" disabled={createApplication.isPending || !form.applicantName.trim() || !form.skill.trim()} data-testid="button-submit-application">{createApplication.isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeft className="size-4" />}{createApplication.isPending ? 'جار الإرسال…' : 'إرسال الطلب'}</Button><p className="text-center text-[11px] leading-5 text-muted-foreground">بإرسالك الطلب، أنت تشارك هذه البيانات مع صاحب الفرصة للمراجعة.</p></form></section>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground"><ShieldCheck className="size-5 shrink-0 text-primary" /><span>المعايير واضحة للجميع: سيتم النظر في الخبرة والمهارة المرسلة مقارنة بمتطلبات الفرصة.</span></div>
    </div>
  );
}

function ArrowRightIcon() {
  return <ArrowLeft className="size-4 rotate-180" />;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><AppShell><Switch><Route path="/" component={Home} /><Route path="/employer" component={Employer} /><Route path="/applicant" component={Applicant} /><Route path="/job/:id" component={JobDetail} /><Route component={NotFound} /></Switch></AppShell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><Router /><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;