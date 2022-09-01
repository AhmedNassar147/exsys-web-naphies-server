/*
 *
 * `createWasselApis`: `middleware`
 *
 */
import createWasselRequest from "../helpers/createWasselRequest.mjs";
import fixWasselApiBodyToValidOne from "../helpers/fixWasselApiBodyToValidOne.mjs";
import { WASSEL_API_NAMES } from "../constants.mjs";

const { CREATE_ELIGIBILITY, CREATE_BENEFICIARY } = WASSEL_API_NAMES;

export default (app) => async (req, _, next) => {
  const { baseUrl } = req;

  [CREATE_BENEFICIARY, CREATE_ELIGIBILITY].forEach((apiName) => {
    app.post(`${baseUrl}/${apiName}`, async (req, res) => {
      const { body } = req;

      const apiResults = await createWasselRequest({
        resourceName: apiName,
        body: fixWasselApiBodyToValidOne(body),
      });

      res
        .header("Content-type", "application/json")
        .status(200)
        .json(apiResults)
        .end();
    });
  });

  next();
};
