/*
 *
 * `createProcessBulkClaimsMiddleware`: `middleware`
 *
 */
import createProcessBulkClaimsMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";

export default createProcessBulkClaimsMiddleware(
  async ({ authorization, data, printValues = false }) =>
    async ({ soa_no, request_type, organization_no }) => {
      console.log({ soa_no, request_type, organization_no, authorization });
      return { hi: "hi" };
    }
);
