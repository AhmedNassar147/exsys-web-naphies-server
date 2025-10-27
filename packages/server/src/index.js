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
import {
  SERVER_PORT,
  FILES_ENCODING_LIMIT,
  CLI_CONFIG,
  CLIENT_NAMES_KEYS,
} from "./constants.mjs";
import createAppConfigFile from "./exsysHelpers/createAppConfigFile.mjs";
import createEligibilityMiddleware from "./middlewares/eligibility/index.mjs";
import createPreauthorizationMiddleware from "./middlewares/preauthorization/index.mjs";
import createClaimMiddleware from "./middlewares/claim/index.mjs";
import createCancelClaimRequestMiddleware from "./middlewares/claim/createCancelClaimRequestMiddleware.mjs";
import createFetchSavedClaimDataToFrontendMiddleware from "./middlewares/claim/createFetchSavedClaimDataToFrontendMiddleware.mjs";
import createProcessBulkClaimsMiddleware from "./middlewares/claim/createProcessBulkClaimsMiddleware.mjs";
import createCommunicationMiddleware from "./middlewares/communication/index.mjs";
import checkPatientInsuranceMiddleware from "./middlewares/patient/checkPatientInsuranceMiddleware.mjs";
import createStatusCheckRequestMiddleware from "./middlewares/claim/createStatusCheckRequestMiddleware.mjs";
import createTotalFilesSizeMiddleware from "./middlewares/files/createTotalFilesSizeMiddleware.mjs";
import checkMedicationValidationMiddleware from "./middlewares/medication/checkMedicationValidation.mjs";
import createMergeClaimsFilesToOneFileMiddleware from "./middlewares/claim/createMergeClaimsFilesToOneFileMiddleware.mjs";
import createClaimOrPreauthSecondResponseMiddleware from "./middlewares/claim/createClaimOrPreauthSecondResponseMiddleware.mjs";
import stopTheProcessIfCertificateNotFound from "./helpers/stopTheProcessIfCertificateNotFound.mjs";
import { getConfigFileData } from "./helpers/getConfigFileData.mjs";

const { client } = CLI_CONFIG;

(async () => {
  const isAuthorizedClient = CLIENT_NAMES_KEYS.includes(client);

  if (!isAuthorizedClient) {
    createCmdMessage({
      type: "error",
      message: "client is not authorized",
    });

    process.kill(process.pid);
    process.exit();
  }

  await createAppConfigFile(client);

  const shouldStopApp = await stopTheProcessIfCertificateNotFound();

  if (shouldStopApp) {
    process.kill(process.pid);
    process.exit();
  }

  (async () => await import("./polls/index.mjs"))();

  const { bridgeServerPort } = await getConfigFileData();

  const serverPort = bridgeServerPort || SERVER_PORT;

  const app = express();
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ limit: FILES_ENCODING_LIMIT }));
  app.use(bodyParser.text());
  app.use(bodyParser.raw({ limit: FILES_ENCODING_LIMIT }));
  app.use("/eligibility", createEligibilityMiddleware(app));
  app.use("/preauth", createPreauthorizationMiddleware(app)); //
  app.use("/claim", createClaimMiddleware(app)); //;
  app.use("/cancelClaimRequest", createCancelClaimRequestMiddleware(app)); //;
  app.use("/processSoaClaims", createProcessBulkClaimsMiddleware(app)); //
  app.use(
    "/querySavedClaimOrPreauthData",
    createFetchSavedClaimDataToFrontendMiddleware(app)
  );
  app.use("/validateMedications", checkMedicationValidationMiddleware(app));
  app.use(
    "/fetchCommunicationResponseOrRequest",
    createCommunicationMiddleware(app)
  ); //

  app.use("/checkPatientInsurance", checkPatientInsuranceMiddleware(app)); //
  app.use(
    "/checkClaimOrPreauthStatus",
    createStatusCheckRequestMiddleware(app)
  ); //;
  app.use(
    "/checkClaimOrPreauthSecondResponse",
    createClaimOrPreauthSecondResponseMiddleware(app)
  ); //;

  app.use("/getFilesTotalSize", createTotalFilesSizeMiddleware(app)); //;
  app.use(
    "/mergeClaimsFilesToOne",
    createMergeClaimsFilesToOneFileMiddleware(app)
  ); //;

  const res = app.listen(serverPort, () =>
    createCmdMessage({
      type: "success",
      message: `app is running on http://localhost:${serverPort}`,
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
