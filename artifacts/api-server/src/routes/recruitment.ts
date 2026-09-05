import { Router, type IRouter } from "express";
import {
  CreateApplicationBody,
  CreateApplicationParams,
  CreateJobBody,
  GetJobParams,
  ListJobApplicationsParams,
} from "@workspace/api-zod";

type Job = {
  id: number;
  title: string;
  minExperience: number;
  skill: string;
  description?: string;
  createdAt: string;
};

type Application = {
  id: number;
  jobId: number;
  applicantName: string;
  experience: number;
  skill: string;
  qualified: boolean;
  status: "qualified" | "reviewing" | "not_qualified";
  createdAt: string;
};

const jobs: Job[] = [
  {
    id: 1,
    title: "مهندس برمجيات Python",
    minExperience: 2,
    skill: "python",
    description:
      "نبحث عن مهندس ينضم إلى فريق المنتج لبناء خدمات موثوقة وتجارب تقنية سهلة الاستخدام.",
    createdAt: "2026-09-05T09:30:00.000Z",
  },
  {
    id: 2,
    title: "مطور واجهات React",
    minExperience: 1,
    skill: "react",
    description:
      "فرصة للعمل على واجهات سريعة ومتجاوبة ضمن فريق يهتم بالتفاصيل وتجربة المستخدم.",
    createdAt: "2026-09-04T14:15:00.000Z",
  },
];

const applications: Application[] = [
  {
    id: 1,
    jobId: 1,
    applicantName: "سارة أحمد",
    experience: 4,
    skill: "python",
    qualified: true,
    status: "qualified",
    createdAt: "2026-09-05T11:20:00.000Z",
  },
  {
    id: 2,
    jobId: 2,
    applicantName: "محمد علي",
    experience: 1,
    skill: "javascript",
    qualified: false,
    status: "not_qualified",
    createdAt: "2026-09-05T16:45:00.000Z",
  },
];

let nextJobId = 3;
let nextApplicationId = 3;

const router: IRouter = Router();

function serializeJob(job: Job) {
  return {
    ...job,
    applicationCount: applications.filter(
      (application) => application.jobId === job.id,
    ).length,
  };
}

function findJob(jobId: number) {
  return jobs.find((job) => job.id === jobId);
}

router.get("/jobs", (_req, res) => {
  res.json(jobs.map(serializeJob));
});

router.post("/jobs", (req, res) => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات الوظيفة غير مكتملة أو غير صحيحة." });
    return;
  }

  const job: Job = {
    id: nextJobId++,
    title: parsed.data.title.trim(),
    minExperience: parsed.data.minExperience,
    skill: parsed.data.skill.trim().toLowerCase(),
    description: parsed.data.description?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  jobs.unshift(job);
  res.status(201).json(serializeJob(job));
});

router.get("/jobs/:jobId", (req, res) => {
  const parsed = GetJobParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "رقم الوظيفة غير صحيح." });
    return;
  }

  const job = findJob(parsed.data.jobId);
  if (!job) {
    res.status(404).json({ error: "الوظيفة غير موجودة." });
    return;
  }

  res.json({
    ...serializeJob(job),
    applications: applications.filter(
      (application) => application.jobId === job.id,
    ),
  });
});

router.get("/jobs/:jobId/applications", (req, res) => {
  const parsed = ListJobApplicationsParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "رقم الوظيفة غير صحيح." });
    return;
  }

  if (!findJob(parsed.data.jobId)) {
    res.status(404).json({ error: "الوظيفة غير موجودة." });
    return;
  }

  res.json(
    applications.filter((application) => application.jobId === parsed.data.jobId),
  );
});

router.post("/jobs/:jobId/applications", (req, res) => {
  const params = CreateApplicationParams.safeParse(req.params);
  const body = CreateApplicationBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "بيانات التقديم غير مكتملة أو غير صحيحة." });
    return;
  }

  const job = findJob(params.data.jobId);
  if (!job) {
    res.status(404).json({ error: "الوظيفة غير موجودة." });
    return;
  }

  const normalizedSkill = body.data.skill.trim().toLowerCase();
  const qualified =
    body.data.experience >= job.minExperience &&
    normalizedSkill.includes(job.skill);
  const application: Application = {
    id: nextApplicationId++,
    jobId: job.id,
    applicantName: body.data.applicantName.trim(),
    experience: body.data.experience,
    skill: normalizedSkill,
    qualified,
    status: qualified ? "qualified" : "not_qualified",
    createdAt: new Date().toISOString(),
  };

  applications.unshift(application);
  res.status(201).json(application);
});

router.get("/dashboard/summary", (_req, res) => {
  res.json({
    jobCount: jobs.length,
    applicationCount: applications.length,
    qualifiedCount: applications.filter((application) => application.qualified)
      .length,
    recentApplications: applications.slice(0, 5),
  });
});

export default router;