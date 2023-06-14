/*
 *
 * server: `exsys-web-naphies-server`.
 *
 */
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { PACKAGE_JSON_APP_CONFIG } from "./constants.mjs";
import createEligibilityMiddleware from "./middlewares/eligibility/index.mjs";
import "./nphiesHelpers/eligibility/try.mjs";

const { serverPort: SERVER_PORT } = PACKAGE_JSON_APP_CONFIG;

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.raw());
app.use("/eligibility", createEligibilityMiddleware(app));

app.listen(SERVER_PORT, () =>
  console.log(`app is running on http://localhost:${SERVER_PORT}`)
);
