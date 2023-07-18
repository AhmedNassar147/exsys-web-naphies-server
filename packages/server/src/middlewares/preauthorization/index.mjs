/*
 *
 * `createPreauthorizationMiddleware`: `middleware`
 *
 */
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";
import createPreauthorizationMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import fetchExsysPreauthorizationDataAndCallNphies from "../../exsysHelpers/fetchExsysPreauthorizationDataAndCallNphies.mjs";

export default createPreauthorizationMiddleware(
  async ({ preauth_pk, authorization, productsData }) => {
    const requestParams = {
      authorization,
      preauth_pk,
    };

    const frontEndData = {
      productsData,
    };

    return await fetchExsysPreauthorizationDataAndCallNphies({
      requestMethod: "GET",
      nphiesRequestType: NPHIES_REQUEST_TYPES.PREAUTH,
      requestParams,
      frontEndData,
      printValues: true,
    });
  }
);
