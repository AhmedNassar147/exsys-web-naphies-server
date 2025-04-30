/*
 *
 * `createClaimOrPreauthSecondResponseMiddleware`: `middleware`
 *
 */
import { createMappedRequestsArray } from "@exsys-web-server/helpers";
import createClaimOrPreauthSecondResponseMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import fetchClaimOrPreauthForSecondResponse from "../../exsysHelpers/FetchClaimOrPreauthForSecondResponse.mjs";

export default createClaimOrPreauthSecondResponseMiddleware(
  async ({ data, authorization, printValues = false, formatReturnedResults }) =>
    await createMappedRequestsArray({
      dataArray: data,
      printValues,
      formatReturnedResults,
      asyncFn: async ({ requestType, primaryKey }) =>
        await fetchClaimOrPreauthForSecondResponse({
          authorization,
          requestType,
          primaryKey,
        }),
    })
);
