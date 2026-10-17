import { Router } from "express";
import authRouter from "./auth.js";
import profileRouter from "./profile.js";
import productsRouter from "./products.js";
import posRouter from "./pos.js";
import debtsRouter from "./debts.js";
import customersRouter from "./customers.js";
import ordersRouter from "./orders.js";
import reportsRouter from "./reports.js";
import webhookRouter from "./webhook.js";

/**
 * BiznesGO yagona API routeri (`/api/biznesgo/*` va `/api/bot/partner/*`).
 */
export const biznesgoRouter = Router();

biznesgoRouter.use("/", authRouter);
biznesgoRouter.use("/", profileRouter);
biznesgoRouter.use("/", productsRouter);
biznesgoRouter.use("/", posRouter);
biznesgoRouter.use("/", debtsRouter);
biznesgoRouter.use("/", customersRouter);
biznesgoRouter.use("/", ordersRouter);
biznesgoRouter.use("/", reportsRouter);
biznesgoRouter.use("/", webhookRouter);

export default biznesgoRouter;

