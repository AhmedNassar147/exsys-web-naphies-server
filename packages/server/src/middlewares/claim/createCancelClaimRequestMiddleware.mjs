/*
 *
 * `createCancelClaimRequestMiddleware`: `middleware`
 *
 */
import createCancelClaimRequestMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createMappedClaimOrPreauthCancellation from "../../exsysHelpers/createMappedClaimOrPreauthCancellationOrStatusCheck.mjs";

export default createCancelClaimRequestMiddleware(
  async ({ authorization, printValues = false, data }) =>
    await createMappedClaimOrPreauthCancellation({
      data,
      authorization,
      printValues,
    })
);
