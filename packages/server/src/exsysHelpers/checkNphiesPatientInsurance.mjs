/*
 *
 * Helper: `checkNphiesPatientInsurance`.
 *
 */
import {
  isArrayHasData,
  isObjectHasData,
  writeResultFile,
  createDateFromNativeDate,
  isAlreadyReversedDate,
} from "@exsys-web-server/helpers";
import createNphiesRequest from "../helpers/createNphiesRequest.mjs";
import { CLI_CONFIG, NPHIES_API_URLS } from "../constants.mjs";

const { production } = CLI_CONFIG;
const {
  NPHIES_CHECK_INSURANCE_PRODUCTION,
  NPHIES_CHECK_INSURANCE_DEVELOPMENT,
} = NPHIES_API_URLS;

const lowerFirstLetter = (value) => {
  const [firstLetter, ...otherLetters] = [...(value || "")];
  return [firstLetter.toLowerCase(), ...otherLetters].join("");
};

const transformResults = (result) => {
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
          [lowerKey]: transformResults(value),
        };
      }

      if (isValueArray) {
        finalResults = {
          ...finalResults,
          [lowerKey]: value.map(transformResults),
        };
      }

      if (!isValueObject && !isValueArray) {
        const _value = isAlreadyReversedDate(value)
          ? createDateFromNativeDate(value, { returnReversedDate: false })
              .dateString
          : value;

        finalResults[lowerKey] = _value;
      }
    });

    return finalResults;
  }

  return result;
};

const checkNphiesPatientInsurance = async ({
  patientKey,
  systemType,
  printValues,
}) => {
  // https://hsb.nphies.sa/checkinsurance?PatientKey=2005274879&SystemType=1
  // http://hsb.oba.nphies.sa/checkinsurance?PatientKey=2005274879&SystemType=1
  const results = await createNphiesRequest({
    baseAPiUrl: production
      ? NPHIES_CHECK_INSURANCE_PRODUCTION
      : NPHIES_CHECK_INSURANCE_DEVELOPMENT,
    requestMethod: "GET",
    requestParams: {
      PatientKey: patientKey,
      SystemType: systemType,
    },
  });

  const { result, isSuccess } = results;

  if (printValues) {
    await writeResultFile({
      data: {
        params: {
          patientKey,
          systemType,
        },
        data: results,
      },
      folderName: printFolderName,
    });
  }

  const apiResults = isSuccess ? transformResults(result) : result;

  return {
    apiResults: apiResults || {},
    isSuccess,
  };
};

export default checkNphiesPatientInsurance;
