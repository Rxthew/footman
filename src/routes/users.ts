import express from "express";
import { Request, Response, NextFunction } from "express";
const router = express.Router();

/* GET users listing. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
router.get("/", function (_req: Request, res: Response, _next: NextFunction) {
  res.send("respond with a resource");
});

export default router;
