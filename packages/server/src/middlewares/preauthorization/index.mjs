/*
 *
 * `createPreauthorizationMiddleware`: `middleware`
 *
 */
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
      printValues: false,
      requestMethod: "GET",
      requestParams,
      frontEndData,
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