/*
 *
 * server: `exsys-web-naphies-server`.
 *
 */
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { PACKAGE_JSON_APP_CONFIG } from "./constants.mjs";
import createLocalStorageFolderFiles from "./nodeHelpers/createLocalStorageFolderFiles.mjs";
import createEligibilityMiddleware from "./middlewares/eligibility/index.mjs";

const { serverPort: SERVER_PORT } = PACKAGE_JSON_APP_CONFIG;

await createLocalStorageFolderFiles();
// await makeEligibilityRequest({
//   provider_license: "PR-FHIR",
//   provider_organization_reference: 1,
//   provider_organization_name: "Ibby Davydoch",
//   payer_license: "INS-FHIR",
//   payer_organization_reference: 6,
//   payer_organization_name: "Insurance Company 18",
//   request_id: "247662",
//   purpose: ["validation"],
//   priority_code: "stat",
//   coverage_type: "EHCPOL",
//   coverage_id: 21,
//   member_id: 5464554586,
//   patient_id: "5588",
//   national_id: "1789543658",
//   national_id_type: "DP",
//   // staff_name,
//   staff_first_name: "Sara",
//   staff_middle_name: "Bashir",
//   staff_last_name: "Ahmad",
//   staff_phone: "0099656856",
//   patient_gender: "male",
//   patient_birthdate: "04-08-1949",
//   patient_martial_status: "M",
//   relationship: "self",
//   period_start_date: "28-03-2021",
//   period_end_date: "28-03-2021",
// });

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
