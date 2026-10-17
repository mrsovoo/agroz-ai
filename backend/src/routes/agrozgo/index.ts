import { Router } from "express";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import ordersRouter from "./orders.js";
import specialistsRouter from "./specialists.js";
import weatherRouter from "./weather.js";
import diagnoseRouter from "../diagnose.js";
import newsRouter from "../news.js";
import locationRouter from "../location.js";
import profileRouter from "../profile.js";
import pharmaciesRouter from "../pharmacies.js";
import geoRouter from "../geo.js";
import notificationsRouter from "../notifications.js";

/**
 * AgrozGO yagona API routeri (`/api/agrozgo/*`).
 */
export const agrozgoRouter = Router();

agrozgoRouter.use("/auth", authRouter);
agrozgoRouter.use("/products", productsRouter);
agrozgoRouter.use("/medicines", productsRouter);
agrozgoRouter.use("/orders", ordersRouter);
agrozgoRouter.use("/specialists", specialistsRouter);
agrozgoRouter.use("/weather", weatherRouter);
agrozgoRouter.use("/diagnose", diagnoseRouter);
agrozgoRouter.use("/news", newsRouter);
agrozgoRouter.use("/location", locationRouter);
agrozgoRouter.use("/profile", profileRouter);
agrozgoRouter.use("/pharmacies", pharmaciesRouter);
agrozgoRouter.use("/geo", geoRouter);
agrozgoRouter.use("/notifications", notificationsRouter);

export default agrozgoRouter;

