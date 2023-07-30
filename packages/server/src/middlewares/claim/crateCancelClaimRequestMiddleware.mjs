/*
 *
 * `crateCancelClaimRequestMiddleware`: `middleware`
 *
 */
import crateCancelClaimRequestMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createMappedClaimRequestsToCancellation from "../../exsysHelpers/createMappedClaimRequestsToCancellation.mjs";

export default crateCancelClaimRequestMiddleware(
  async ({ authorization, printValues = false, data }) =>
    await createMappedClaimRequestsToCancellation({
      data,
      authorization,
      printValues,
    })
);
