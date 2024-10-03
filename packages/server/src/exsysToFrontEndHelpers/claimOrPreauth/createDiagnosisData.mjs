/*
 *
 * Helper: `createDiagnosisData`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "../../nphiesHelpers/extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractExtensionsSentToNphies from "../../nphiesHelpers/extraction/extractExtensionsSentToNphies.mjs";

const createDiagnosisData = (diagnosis, diagnosisErrors) => {
  let diagnosisData = undefined;

  if (isArrayHasData(diagnosis)) {
    diagnosisData = diagnosis.map(
      ({
        sequence,
        onAdmission,
        diagnosisCodeableConcept,
        type,
        extension,
      }) => {
        const { code: _onAdmission } =
          extractNphiesCodeAndDisplayFromCodingType(onAdmission);

        const { code: diagCode, display: diagDisplay } =
          extractNphiesCodeAndDisplayFromCodingType(diagnosisCodeableConcept);

        const { code: diagType } = extractNphiesCodeAndDisplayFromCodingType(
          isArrayHasData(type) ? type[0] : {}
        );

        return {
          sequence,
          onAdmission: _onAdmission === "y",
          diagCode,
          diagDisplay,
          diagType,
          ...extractExtensionsSentToNphies(extension),
          error: diagnosisErrors[sequence],
        };
      }
    );
  }

  return diagnosisData;
};

export default createDiagnosisData;
