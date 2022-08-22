/*
 *
 * `createWasselApis`: `middleware`
 *
 */
import createWasselRequest from "../helpers/createWasselRequest.mjs";
import { WASSEL_API_NAMES } from "../constants.mjs";

const { CREATE_ELIGIBILITY, CREATE_BENEFICIARY } = WASSEL_API_NAMES;

export default (app) => async (req, _, next) => {
  const { baseUrl } = req;

  [CREATE_BENEFICIARY, CREATE_ELIGIBILITY].forEach((apiName) => {
    app.post(`${baseUrl}/${apiName}`, async (req, res, next) => {
      const { body } = req;

      const apiResults = await createWasselRequest({
        resourceName: apiName,
        body,
      });

      res.status(200);
      res.header("Content-type", "application/json");
      res.send(apiResults);
      next();
    });
  });

  next();
};
