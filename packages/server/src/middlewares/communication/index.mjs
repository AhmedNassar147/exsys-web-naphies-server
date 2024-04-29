/*
 *
 * `createCommunicationMiddleware`: `middleware`
 *
 */
import createCommunicationMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createMappedCommunicationRequests from "../../exsysHelpers/createMappedCommunicationRequests.mjs";

export default createCommunicationMiddleware(
  async ({ authorization, clientName, printValues = false, data }) =>
    await createMappedCommunicationRequests({
      authorization,
      printValues,
      data,
      clientName,
    })
);
