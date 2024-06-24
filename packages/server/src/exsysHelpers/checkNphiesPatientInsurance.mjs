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
import buildPrintedResultPath from "../helpers/buildPrintedResultPath.mjs";

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
        let _value = isAlreadyReversedDate(value)
          ? createDateFromNativeDate(value, { returnReversedDate: false })
              .dateString
          : value;

        const isNameField = key === "Name";
        if (isNameField) {
          _value = (_value || "").replace(/\d\s-\s|\s\(\d{0,}.+/gm, "");

          const [first, second, third, last] = _value.split(" ");
          const thirdName = last ? third || "." : ".";
          const lastName = last || third || "";

          _value = `${first} ${second} ${thirdName} ${lastName}`;
        }

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
  printFolderName,
  organizationNo,
  clinicalEntityNo,
}) => {
  // https://hsb.nphies.sa/checkinsurance?PatientKey=2005274879&SystemType=1
  // http://hsb.oba.nphies.sa/checkinsurance?PatientKey=2005274879&SystemType=1
  const results = await createNphiesRequest({
    baseAPiUrl: production
      ? NPHIES_CHECK_INSURANCE_PRODUCTION
      : NPHIES_CHECK_INSURANCE_DEVELOPMENT,
    requestMethod: "GET",
    organizationNo,
    clinicalEntityNo,
    requestParams: {
      PatientKey: patientKey,
      SystemType: systemType,
    },
  });

  const { result, isSuccess } = results;

  if (printValues) {
    const folderName = buildPrintedResultPath({
      organizationNo,
      clinicalEntityNo,
      innerFolderName: printFolderName,
      skipThrowingOrganizationError: true,
    });

    console.log("CCHI folderName", folderName);

    await writeResultFile({
      data: {
        params: {
          patientKey,
          systemType,
        },
        data: results,
      },

      folderName: folderName,
    });
  }

  const apiResults = isSuccess ? transformResults(result) : result;

  return {
    apiResults: apiResults || {},
    isSuccess,
  };
};

export default checkNphiesPatientInsurance;
