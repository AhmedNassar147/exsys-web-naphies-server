/*
 *
 * `createFetchSavedClaimDataToFrontendMiddleware`: `middleware`
 *
 */
import { createMappedRequestsArray } from "@exsys-web-server/helpers";
import createFetchSavedClaimDataToFrontendMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import fetchPreauthAndClaimSavedData from "../../exsysHelpers/fetchPreauthAndClaimSavedData.mjs";

export default createFetchSavedClaimDataToFrontendMiddleware(
  async ({ authorization, printValues = false, data }) =>
    await createMappedRequestsArray({
      dataArray: data,
      printValues,
      asyncFn: async (params) =>
        await fetchPreauthAndClaimSavedData({ ...params, authorization }),
    })
);
