/*
 *
 * Middleware: `checkPatientInsuranceMiddleware`.
 *
 */
import {
  isArrayHasData,
  isObjectHasData,
  writeResultFile,
  createDateFromNativeDate,
  isAlreadyReversedDate,
  getCurrentDate,
} from "@exsys-web-server/helpers";
import extractCoverageEligibilityEntryResponseData from "../../nphiesHelpers/extraction/extractCoverageEligibilityEntryResponseData.mjs";
import extractCoverageEntryResponseData from "../../nphiesHelpers/extraction/extractCoverageEntryResponseData.mjs";
import checkPatientInsuranceMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createNphiesRequestPayloadFn from "../../nphiesHelpers/eligibility/index.mjs";
import createNphiesRequest from "../../helpers/createNphiesRequest.mjs";
import createBaseFetchExsysDataAndCallNphiesApi from "../../exsysHelpers/createBaseFetchExsysDataAndCallNphiesApi.mjs";
import extractEligibilityDataSentToNphies from "../../exsysToFrontEndHelpers/eligibility/index.mjs";
import {
  CLI_CONFIG,
  NPHIES_API_URLS,
  EXSYS_API_IDS_NAMES,
} from "../../constants.mjs";

const { production } = CLI_CONFIG;
const {
  NPHIES_CHECK_INSURANCE_PRODUCTION,
  NPHIES_CHECK_INSURANCE_DEVELOPMENT,
} = NPHIES_API_URLS;

const { queryEligibilityDataFromCchi } = EXSYS_API_IDS_NAMES;

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

const extractionFunctionsMap = {
  CoverageEligibilityResponse: extractCoverageEligibilityEntryResponseData,
  Coverage: extractCoverageEntryResponseData,
};

const setErrorIfExtractedDataFoundFn = ({
  eligibilityErrors,
  coverageErrors,
}) => [...(eligibilityErrors || []), ...(coverageErrors || [])];

export default checkPatientInsuranceMiddleware(async (body) => {
  const {
    authorization,
    printValues = false,
    beneficiaryKey,
    systemType: _systemType,
    organization_no,
    customer_no,
    customer_group_no,
  } = body;

  const SystemType = _systemType || "1";

  // https://hsb.nphies.sa/checkinsurance?PatientKey=2005274879&SystemType=1
  // http://hsb.oba.nphies.sa/checkinsurance?PatientKey=2005274879&SystemType=1
  const results = await createNphiesRequest({
    baseAPiUrl: production
      ? NPHIES_CHECK_INSURANCE_PRODUCTION
      : NPHIES_CHECK_INSURANCE_DEVELOPMENT,
    requestMethod: "GET",
    requestParams: {
      PatientKey: beneficiaryKey,
      SystemType,
    },
  });

  const printFolderName = `CCHI/${beneficiaryKey}/${SystemType}`;

  const { result, isSuccess } = results;
  const apiResults = isSuccess ? transformResults(result) : result;

  if (printValues) {
    await writeResultFile({
      data: {
        params: {
          beneficiaryKey,
          SystemType,
        },
        data: results,
      },
      folderName: printFolderName,
    });
  }

  const shouldCallEligibilityApi = !!(
    organization_no &&
    customer_no &&
    customer_group_no
  );

  if (shouldCallEligibilityApi) {
    const {
      name,
      identityNumber,
      expiryDate,
      gender,
      dateOfBirth,
      mobileNumber,
      insuranceCompanyID,
    } = apiResults;
    const [
      patient_first_name,
      patient_second_name,
      patient_third_name,
      patient_family_name,
    ] = (name || "").split(" ");
    const { dateString } = getCurrentDate(true);

    const baseEligibilityData = {
      patient_first_name: patient_first_name || "",
      patient_second_name: patient_second_name || "",
      patient_third_name: patient_third_name || "",
      patient_family_name: patient_family_name || "",
      memberid: identityNumber,
      patient_file_no: identityNumber,
      iqama_no: identityNumber,
      patient_phone: mobileNumber,
      gender: gender === "1" ? "male" : "female",
      birthDate: dateOfBirth || dateString,
      relationship: "self",
      period_start_date: dateString,
      period_end_date: expiryDate,
    };

    const { printData, loggerValue, resultData } =
      await createBaseFetchExsysDataAndCallNphiesApi({
        exsysQueryApiId: queryEligibilityDataFromCchi,
        requestParams: {
          authorization,
          organization_no,
          customer_no,
          customer_group_no,
          insuranceCompanyID,
        },
        requestMethod: "GET",
        printFolderName: `${printFolderName}/eligibility`,
        exsysDataApiPrimaryKeyName: "primaryKey",
        createResultsDataFromExsysResponse: (result) => ({
          ...baseEligibilityData,
          ...result,
        }),
        createNphiesRequestPayloadFn,
        extractionFunctionsMap,
        setErrorIfExtractedDataFoundFn,
        noPatientDataLogger: true,
      });

    const {
      nphiesExtractedData: {
        nodeServerDataSentToNphies,
        nphiesResponse,
        ...nphiesExtractedData
      },
    } = resultData;

    if (printValues) {
      const { data, hasNphiesApiError, folderName } = printData;
      await writeResultFile({
        data: {
          hasNphiesApiError,
          loggerValue,
          ...data,
        },
        folderName: folderName,
      });
    }

    const frontEndEligibilityData = extractEligibilityDataSentToNphies({
      nodeServerDataSentToNaphies: nodeServerDataSentToNphies,
      nphiesResponse,
      nphiesExtractedData,
    });

    return {
      data: {
        ...(apiResults || null),
        frontEndEligibilityData,
      },
    };
  }

  return {
    data: apiResults || {},
  };
});
