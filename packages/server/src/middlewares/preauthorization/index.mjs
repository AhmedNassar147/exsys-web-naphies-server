/*
 *
 * `createPreauthorizationMiddleware`: `middleware`
 *
 */
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";
import createPreauthorizationMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import fetchExsysPreauthorizationDataAndCallNphies from "../../exsysHelpers/fetchExsysPreauthorizationDataAndCallNphies.mjs";

export default createPreauthorizationMiddleware(
  async ({ preauth_pk, authorization }) =>
    await fetchExsysPreauthorizationDataAndCallNphies({
      requestMethod: "GET",
      nphiesRequestType: NPHIES_REQUEST_TYPES.PREAUTH,
      requestParams: {
        authorization,
        preauth_pk,
      },
      printValues: true,
    })
);
