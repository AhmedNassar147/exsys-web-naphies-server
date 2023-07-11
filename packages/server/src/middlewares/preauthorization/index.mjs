/*
 *
 * `createPreauthorizationMiddleware`: `middleware`
 *
 */
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";
import fetchExsysPreauthorizationDataAndCallNphies from "../../exsysHelpers/fetchExsysPreauthorizationDataAndCallNphies.mjs";

const createPreauthorizationMiddleware = (app) => async (req, _, next) => {
  const { originalUrl } = req;

  app.post(originalUrl, async (req, res) => {
    const {
      body: {
        preauth_pk,
        authorization,
        productsData,
        extraSupportInformationData,
      },
    } = req;

    const requestParams = {
      authorization,
      preauth_pk,
    };

    const frontEndData = {
      productsData,
      extraSupportInformationData,
    };

    const apiResults = await fetchExsysPreauthorizationDataAndCallNphies({
      requestMethod: "GET",
      nphiesRequestType: NPHIES_REQUEST_TYPES.PREAUTH,
      requestParams,
      frontEndData,
      printValues: true,
    });

    res
      .header("Content-type", "application/json")
      .status(200)
      .json(apiResults)
      .end();
  });

  next();
};

export default createPreauthorizationMiddleware;
