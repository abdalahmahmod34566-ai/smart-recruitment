import { Router, type IRouter } from "express";
import healthRouter from "./health";
import recruitmentRouter from "./recruitment";

const router: IRouter = Router();

router.use(healthRouter);
router.use(recruitmentRouter);

export default router;
