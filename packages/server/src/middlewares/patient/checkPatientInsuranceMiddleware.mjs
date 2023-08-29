/*
 *
 * Middleware: `checkPatientInsuranceMiddleware`.
 *
 */
import {
  isArrayHasData,
  isObjectHasData,
  writeResultFile,
} from "@exsys-web-server/helpers";
import checkPatientInsuranceMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createNphiesRequest from "../../helpers/createNphiesRequest.mjs";

const lowerFirstLetter = (value) => {
  const [firstLetter, ...otherLetters] = [...(value || "")];
  return [firstLetter.toLowerCase(), ...otherLetters].join("");
};

const lowerCaseEveryResultKeyFirstKeyLetter = (result) => {
  if (isObjectHasData(result)) {
    let finalResults = {};

    Object.keys(result).forEach((key) => {
      const lowerKey = lowerFirstLetter(key);
      const value = result[key];

      const isValueObject = isObjectHasData(value);
      const isValueArray = isArrayHasData(value);

      if (isValueObject) {
        finalResults = {
          ...finalResults,
          [lowerKey]: lowerCaseEveryResultKeyFirstKeyLetter(value),
        };
      }

      if (isValueArray) {
        finalResults = {
          ...finalResults,
          [lowerKey]: value.map(lowerCaseEveryResultKeyFirstKeyLetter),
        };
      }

      if (!isValueObject && !isValueArray) {
        finalResults[lowerKey] = value;
      }
    });

    return finalResults;
  }

  return result;
};

export default checkPatientInsuranceMiddleware(async (body) => {
  const { authorization, printValues = false, nationalId, iqamaType } = body;

  const SystemType = iqamaType || "1";

  // https://hsb.nphies.sa/checkinsurance?PatientKey=2005274879&SystemType=1
  const results = await createNphiesRequest({
    baseAPiUrl: "https://hsb.nphies.sa/checkinsurance",
    requestMethod: "GET",
    requestParams: {
      PatientKey: nationalId,
      SystemType: SystemType,
    },
  });

  const { result, isSuccess } = results;

  if (printValues) {
    await writeResultFile({
      data: {
        params: {
          nationalId,
          iqamaType,
        },
        data: results,
      },
      folderName: `CCHI/${nationalId}/${SystemType}`,
    });
  }

  const apiResults = isSuccess
    ? lowerCaseEveryResultKeyFirstKeyLetter(result)
    : result;

  return apiResults || {};
});
