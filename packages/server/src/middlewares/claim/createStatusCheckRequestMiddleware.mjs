/*
 *
 * `createStatusCheckRequestMiddleware`: `middleware`
 *
 */
import createStatusCheckRequestMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createMappedClaimOrPreauthCancellationOrStatusCheck from "../../exsysHelpers/createMappedClaimOrPreauthCancellationOrStatusCheck.mjs";

export default createStatusCheckRequestMiddleware(
  async ({ authorization, clientName, printValues = false, data }) =>
    await createMappedClaimOrPreauthCancellationOrStatusCheck({
      data,
      authorization,
      printValues,
      clientName,
      isStatusCheck: true,
    })
);
