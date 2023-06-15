/*
 *
 * server: `exsys-web-naphies-server`.
 *
 */
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
// import collectProcessOptionsSync from "./nodeHelpers/collectProcessOptionsSync.mjs";
import { SERVER_PORT, RESTART_SERVER_MS } from "./constants.mjs";
import restartProcess from "./nodeHelpers/restartProcess.mjs";
import createEligibilityMiddleware from "./middlewares/eligibility/index.mjs";
import "./nphiesHelpers/eligibility/try.mjs";

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.raw());
app.use("/eligibility", createEligibilityMiddleware(app));

const res = app.listen(SERVER_PORT, () =>
  console.log(`app is running on http://localhost:${SERVER_PORT}`)
);

res.on("error", (error) => {
  console.log("server error", error);
  res.close();
  console.log(`restarting server after ${RESTART_SERVER_MS / 1000} seconds`);
  restartProcess();
});
