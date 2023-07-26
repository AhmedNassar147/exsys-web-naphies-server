/*
 *
 * `createPreauthorizationMiddleware`: `middleware`
 *
 */
import { createMappedRequestsArray } from "@exsys-web-server/helpers";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";
import createPreauthorizationMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import fetchExsysPreauthorizationDataAndCallNphies from "../../exsysHelpers/fetchExsysPreauthorizationDataAndCallNphies.mjs";

export default createPreauthorizationMiddleware(
  async ({ authorization, printValues = false, data }) =>
    await createMappedRequestsArray({
      dataArray: data,
      printValues,
      asyncFn: async ({ preauth_pk }) =>
        await fetchExsysPreauthorizationDataAndCallNphies({
          requestMethod: "GET",
          nphiesRequestType: NPHIES_REQUEST_TYPES.PREAUTH,
          requestParams: {
            authorization,
            preauth_pk,
          },
        }),
    })
);
