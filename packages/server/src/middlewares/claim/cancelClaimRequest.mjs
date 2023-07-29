/*
 *
 * `cancelClaimRequest`: `middleware`
 *
 */
import createClaimMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
// import createMappedClaimRequests from "../../exsysHelpers/createMappedClaimRequests.mjs";

export default createClaimMiddleware(
  async ({ authorization, printValues = false, data }) =>
    () => ({})
);
