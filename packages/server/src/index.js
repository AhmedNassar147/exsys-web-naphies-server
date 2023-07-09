/*
 *
 * server: `exsys-web-naphies-server`.
 *
 */
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import {
  checkPathExists,
  restartProcess,
  RESTART_SERVER_MS,
} from "@exsys-web-server/helpers";
import {
  SERVER_PORT,
  NPHIES_CERT_FILE_NAME,
  CLI_CONFIG,
} from "./constants.mjs";
import createEligibilityMiddleware from "./middlewares/eligibility/index.mjs";
import createPreauthorizationMiddleware from "./middlewares/preauthorization/index.mjs";
// keep polls at bottom
// import "./exsysHelpers/runPreauthorizationPoll.mjs";
// import "./exsysHelpers/fetchExsysInvoicesPolls.mjs";

const { ignoreCert } = CLI_CONFIG;

(async () => {
  if (!ignoreCert && !(await checkPathExists(NPHIES_CERT_FILE_NAME))) {
    console.log(
      `can't find the certificate where the path is ${NPHIES_CERT_FILE_NAME}`
    );

    console.log(`restarting server after ${RESTART_SERVER_MS / 1000} seconds`);
    restartProcess();

    return;
  }

  const app = express();
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(bodyParser.text());
  app.use(bodyParser.raw());
  app.use("/eligibility", createEligibilityMiddleware(app));
  app.use("/preauth", createPreauthorizationMiddleware(app));

  const res = app.listen(SERVER_PORT, () =>
    console.log(`app is running on http://localhost:${SERVER_PORT}`)
  );

  res.on("error", () => {
    res.close(() => {
      process.kill(process.pid);
      console.log(
        `restarting server after ${RESTART_SERVER_MS / 1000} seconds`
      );
      restartProcess();
    });
  });
})();
