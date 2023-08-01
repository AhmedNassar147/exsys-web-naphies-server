/*
 *
 * `createProcessMedicalReviewedClaimsMiddleware`: `middleware`
 *
 */
import createProcessMedicalReviewedClaimsMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";

export default createProcessMedicalReviewedClaimsMiddleware(
  async ({
      authorization,
      data,
      requestType,
      organizationNo,
      soa_no,
      patient_file_no,
      printValues = false,
    }) =>
    () => {}
);
