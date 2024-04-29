/*
 *
 * `createClaimMiddleware`: `middleware`
 *
 */
import createClaimMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createMappedClaimRequests from "../../exsysHelpers/createMappedClaimRequests.mjs";

export default createClaimMiddleware(
  async ({ authorization, clientName, printValues = false, data }) =>
    await createMappedClaimRequests({
      authorization,
      printValues,
      data,
      clientName,
    })
);
