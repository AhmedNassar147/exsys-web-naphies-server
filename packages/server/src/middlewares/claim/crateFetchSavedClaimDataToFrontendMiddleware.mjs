/*
 *
 * `crateFetchSavedClaimDataToFrontendMiddleware`: `middleware`
 *
 */
import { createMappedRequestsArray } from "@exsys-web-server/helpers";
import crateFetchSavedClaimDataToFrontendMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import fetchPreauthAndClaimSavedData from "../../exsysHelpers/fetchPreauthAndClaimSavedData.mjs";

export default crateFetchSavedClaimDataToFrontendMiddleware(
  async ({ authorization, printValues = false, data }) =>
    await createMappedRequestsArray({
      dataArray: data,
      printValues,
      asyncFn: async (params) =>
        await fetchPreauthAndClaimSavedData({ ...params, authorization }),
    })
);
