/*
 *
 * `createWasselApis`: `middleware`
 *
 */
import createWasselRequest from "../helpers/createWasselRequest.mjs";
import fixWasselApiBodyToValidOne from "../helpers/fixWasselApiBodyToValidOne.mjs";
import convertCchiResultToSimpleData from "../helpers/convertCchiResultToSimpleData.mjs";
import { WASSEL_API_NAMES } from "../constants.mjs";

const { CREATE_ELIGIBILITY, CREATE_BENEFICIARY, QUEY_CCHI_BENEFICIARY } =
  WASSEL_API_NAMES;

export default (app) => async (req, _, next) => {
  const { baseUrl } = req;

  [CREATE_BENEFICIARY, CREATE_ELIGIBILITY].forEach((apiName) => {
    app.post(`${baseUrl}/${apiName}`, async (req, res) => {
      const { body } = req;

      const bodyData = fixWasselApiBodyToValidOne(body);

      console.log("apiName", bodyData);

      const apiResults = await createWasselRequest({
        resourceName: apiName,
        body: bodyData,
      });

      res
        .header("Content-type", "application/json")
        .status(200)
        .json(apiResults)
        .end();
    });
  });

  app.get(
    `${baseUrl}/${QUEY_CCHI_BENEFICIARY}/patientKey/:patientKey`,
    async (req, res) => {
      const {
        params: { patientKey },
      } = req;

      const apiResults = await createWasselRequest({
        xBaseApiUrl: "https://api.eclaims.waseel.com",
        resourceName: QUEY_CCHI_BENEFICIARY,
        requestMethod: "GET",
        requestParams: {
          patientKey: patientKey,
        },
      });

      res
        .header("Content-type", "application/json")
        .status(200)
        .json(convertCchiResultToSimpleData(apiResults))
        .end();
    }
  );

  next();
};
