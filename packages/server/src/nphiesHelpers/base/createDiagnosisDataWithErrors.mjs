/*
 *
 * Helper: `createDiagnosisDataWithErrors`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "../extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractExtensionsSentToNphies from "../extraction/extractExtensionsSentToNphies.mjs";

const createDiagnosisDataWithErrors = (diagnosis, diagnosisErrors) => {
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

export default createDiagnosisDataWithErrors;
