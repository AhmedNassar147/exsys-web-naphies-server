/*
 *
 * Helper: `createSupportInfoDataWithErrors`.
 *
 */
import { getLastPartOfUrl, isArrayHasData } from "@exsys-web-server/helpers";
import extractNphiesCodeAndDisplayFromCodingType from "../extraction/extractNphiesCodeAndDisplayFromCodingType.mjs";
import extractContentAttachment from "../extraction/extractContentAttachment.mjs";

const createSupportInfoDataWithErrors = (supportingInfo, supportInfoErrors) => {
  if (!isArrayHasData(supportingInfo)) {
    return undefined;
  }

  return supportingInfo.map(
    ({
      sequence,
      category,
      code,
      valueQuantity,
      valueAttachment,
      valueString,
      timingDate,
      timingPeriod,
      reason,
    }) => {
      const { code: categoryCode } =
        extractNphiesCodeAndDisplayFromCodingType(category);

      const {
        code: codeValue,
        display,
        text,
      } = extractNphiesCodeAndDisplayFromCodingType(code);

      const { code: absenceReasonCode, codingSystemUrl: absenceReasonUrl } =
        extractNphiesCodeAndDisplayFromCodingType(reason);

      let value = valueString || timingDate;
      let unit;
      let title;
      let contentType;
      let creation;

      if (valueQuantity) {
        value = valueQuantity.value;
        unit = valueQuantity.code;
      }

      if (valueAttachment) {
        const result = extractContentAttachment(valueAttachment);

        value = result.value;
        contentType = result.contentType;
        title = result.title;
        creation = result.creation;
      }

      if (timingPeriod) {
        const { start, end } = timingPeriod;
        value = [start, end].filter(Boolean).join(" ~ ");
      }

      const __absenceReasonCode = [
        absenceReasonCode,
        getLastPartOfUrl(absenceReasonUrl),
      ]
        .filter(Boolean)
        .join("  ");

      return {
        sequence,
        categoryCode,
        code: codeValue,
        display,
        text,
        value,
        unit,
        title,
        contentType,
        creation,
        extendable: "y",
        absenceReasonCode: __absenceReasonCode || undefined,
        error: supportInfoErrors[sequence],
      };
    }
  );
};

export default createSupportInfoDataWithErrors;
