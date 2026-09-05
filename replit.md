# نظام التوظيف والمقابلات الذكي

تطبيق ويب عربي يساعد أصحاب العمل على نشر الوظائف ومراجعة المتقدمين، ويساعد المتقدمين على اكتشاف الفرص والتقديم مع تقييم فوري للملاءمة.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/smart-recruitment` — الواجهة الرئيسية العربية المتجاوبة.
- `artifacts/api-server/src/routes/recruitment.ts` — عمليات الوظائف والتقديمات والملخص.
- `lib/api-spec/openapi.yaml` — المصدر الوحيد لعقود API؛ شغّل codegen بعد أي تعديل.
- `artifacts/smart-recruitment/src/index.css` — نظام الألوان والخطوط وحالات الواجهة.

## Architecture decisions

- الواجهة تستخدم React Query hooks المولدة من OpenAPI بدل أنواع أو طلبات يدوية.
- بيانات النسخة الأولى محفوظة في الذاكرة لتطابق النموذج الأصلي البسيط، مع طبقة API قابلة للترقية إلى PostgreSQL لاحقًا.
- تقييم المتقدم يتم على الخادم بمقارنة الخبرة والمهارة المطلوبة قبل إعادة نتيجة التقديم.

## Product

- لوحة ملخص تعرض الوظائف والطلبات والمتقدمين المطابقين.
- وضع صاحب العمل لنشر وظيفة ومراجعة المتقدمين.
- وضع المتقدم لاستعراض الفرص والتقديم عليها.
- تفاصيل الوظيفة وحالات التحميل والخطأ والفراغ ورسائل النجاح.

## User preferences

- الواجهة والرسائل للمستخدم باللغة العربية وباتجاه RTL.

## Gotchas

- بعد تعديل `lib/api-spec/openapi.yaml` يجب تشغيل `pnpm --filter @workspace/api-spec run codegen`.
- بيانات الوظائف الحالية مؤقتة داخل ذاكرة خادم API وتعود إلى بيانات البداية عند إعادة تشغيل الخادم.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
