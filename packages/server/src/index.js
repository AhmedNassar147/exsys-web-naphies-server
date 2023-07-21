/*
 *
 * server: `exsys-web-naphies-server`.
 *
 */
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import {
  restartProcess,
  RESTART_SERVER_MS,
  createCmdMessage,
} from "@exsys-web-server/helpers";
import { SERVER_PORT, FILES_ENCODING_LIMIT } from "./constants.mjs";
import createEligibilityMiddleware from "./middlewares/eligibility/index.mjs";
import createPreauthorizationMiddleware from "./middlewares/preauthorization/index.mjs";
import createClaimMiddleware from "./middlewares/claim/index.mjs";
import stopTheProcessIfCertificateNotFound from "./helpers/stopTheProcessIfCertificateNotFound.mjs";

(async () => await import("./polls/index.mjs"))();

(async () => {
  await stopTheProcessIfCertificateNotFound(false);

  const app = express();
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ limit: FILES_ENCODING_LIMIT }));
  app.use(bodyParser.text());
  app.use(bodyParser.raw({ limit: FILES_ENCODING_LIMIT }));
  app.use("/eligibility", createEligibilityMiddleware(app));
  app.use("/preauth", createPreauthorizationMiddleware(app));
  app.use("/claim", createClaimMiddleware(app));

  const res = app.listen(SERVER_PORT, () =>
    createCmdMessage({
      type: "success",
      message: `app is running on http://localhost:${SERVER_PORT}`,
    })
  );

  res.on("error", () => {
    res.close(() => {
      process.kill(process.pid);
      createCmdMessage({
        type: "info",
        message: `restarting server after ${RESTART_SERVER_MS / 1000} seconds`,
      });
      restartProcess();
    });
  });
})();
