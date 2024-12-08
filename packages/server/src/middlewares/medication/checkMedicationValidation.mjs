/*
 *
 * `checkMedicationValidationMiddleware`: `middleware`
 *
 */
import { createMappedRequestsArray } from "@exsys-web-server/helpers";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";
import checkMedicationValidationMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import fetchExsysMedicationCheckingDataAndCallNphies from "../../exsysHelpers/fetchExsysMedicationCheckingDataAndCallNphies.mjs";

export default checkMedicationValidationMiddleware(
  async ({ authorization, printValues = false, data }) =>
    await createMappedRequestsArray({
      dataArray: data,
      printValues,
      asyncFn: async ({ visitId }) =>
        await fetchExsysMedicationCheckingDataAndCallNphies({
          nphiesRequestType: NPHIES_REQUEST_TYPES.PRESCRIBER,
          requestParams: {
            authorization,
            preauth_pk: visitId,
          },
        }),
    })
);
