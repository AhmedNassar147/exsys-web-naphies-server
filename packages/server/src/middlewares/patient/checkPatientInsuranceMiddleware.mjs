/*
 *
 * Middleware: `checkPatientInsuranceMiddleware`.
 *
 */
import {
  writeResultFile,
  getCurrentDate,
  isArrayHasData,
  createDateFromNativeDate,
} from "@exsys-web-server/helpers";
import extractCoverageEligibilityEntryResponseData from "../../nphiesHelpers/extraction/extractCoverageEligibilityEntryResponseData.mjs";
import extractCoverageEntryResponseData from "../../nphiesHelpers/extraction/extractCoverageEntryResponseData.mjs";
import checkPatientInsuranceMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createNphiesRequestPayloadFn from "../../nphiesHelpers/eligibility/index.mjs";
import checkNphiesPatientInsurance from "../../exsysHelpers/checkNphiesPatientInsurance.mjs";
import createBaseFetchExsysDataAndCallNphiesApi from "../../exsysHelpers/createBaseFetchExsysDataAndCallNphiesApi.mjs";
import extractEligibilityDataSentToNphies from "../../exsysToFrontEndHelpers/eligibility/index.mjs";
import { EXSYS_API_IDS_NAMES } from "../../constants.mjs";
import createExsysRequest from "../../helpers/createExsysRequest.mjs";

const { queryEligibilityDataFromCchi, queryExsysCchiPatient } =
  EXSYS_API_IDS_NAMES;

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
    clinicalEntityNo: __clinicalEntityNo,
    withoutCchiChecking,
  } = body;

  const clinicalEntityNo = __clinicalEntityNo || "";

  const systemType = _systemType || "1";

  const printFolderName = `CCHI/${beneficiaryKey}/${systemType}`;

  const { apiResults, cchiOriginalResults, isCCHITotallySuccesseded } =
    withoutCchiChecking
      ? {
          apiResults: {},
          cchiOriginalResults: {},
          isCCHITotallySuccesseded: false,
        }
      : await checkNphiesPatientInsurance({
          patientKey: beneficiaryKey,
          systemType,
          printValues,
          printFolderName,
          organizationNo: organization_no,
          clinicalEntityNo,
        });
  const { insurance, errorCode, errorDescription } = apiResults;

  const [firstItem] = insurance || [];

  const {
    name,
    identityNumber,
    gender,
    dateOfBirth: insuranceDateOfBirth,
    mobileNumber,
    insuranceCompanyID,
    beneficiaryNumber,
    nationalityCode,
    nationalityID,
    nationality,
    policyNumber,
    className,
  } = firstItem || {};

  let exsysCchiPatientData = {};

  if (isCCHITotallySuccesseded) {
    const { result } = await createExsysRequest({
      resourceName: queryExsysCchiPatient,
      requestMethod: "GET",
      retryTimes: 0,
      requestParams: {
        authorization,
        organization_no,
        beneficiaryId: beneficiaryKey,
        nationalityCode: nationalityCode || nationalityID || nationality,
        gender,
        insuranceCompanyId: insuranceCompanyID,
        policyNumber,
        className: (className || "")
          .replace(/\s{1,}/g, " ")
          .split(" ")
          .filter((v) => v !== "class")
          .join(" "),
      },
    });

    const { data } = result || {};
    exsysCchiPatientData = data || {};
  }

  const {
    nationalityCode: exsysNationalityCode,
    nationality: nationalityName,
    gender: genderName,
    genderCode,
    customerNo,
    customerGroupNo,
    dateOfBirth,
  } = exsysCchiPatientData;

  const __customer_no = customer_no || customerNo || "";
  const __customer_group_no = customer_group_no || customerGroupNo || "";
  const __dateOfBirth =
    dateOfBirth ||
    createDateFromNativeDate(insuranceDateOfBirth, {
      returnReversedDate: false,
    }).dateString;

  const shouldCallEligibilityApi =
    (withoutCchiChecking || isCCHITotallySuccesseded) &&
    !!(organization_no && __customer_no && __customer_group_no);

  const __insuranceData = isArrayHasData(insurance)
    ? insurance.map((item) => ({
        ...item,
        nationalityCode: exsysNationalityCode,
        nationality: nationalityName,
        dateOfBirth: __dateOfBirth,
        gender: genderName,
        genderCode,
      }))
    : [];

  const baseResponse = {
    errorCode,
    errorDescription,
    cchiOriginalResults,
    customerNo: __customer_no,
    customerGroupNo: __customer_group_no,
    exsysCchiPatientData,
    insurance: __insuranceData,
  };

  if (shouldCallEligibilityApi) {
    const [
      patient_first_name,
      patient_second_name,
      patient_third_name,
      patient_family_name,
    ] = (name || "").split(" ");
    // const { dateString } = getCurrentDate(true);

    const baseEligibilityData = {
      patient_first_name: patient_first_name || "",
      patient_second_name: patient_second_name || "",
      patient_third_name: patient_third_name || "",
      patient_family_name: patient_family_name || "",
      patient_file_no: beneficiaryNumber,
      memberid: beneficiaryNumber,
      iqama_no: identityNumber || beneficiaryKey,
      patient_phone: mobileNumber,
      gender: genderName || (gender === "1" ? "male" : "female"),
      birthDate: __dateOfBirth || "1900-01-01",
      relationship: "self",
    };

    const exsysApiParams = {
      authorization,
      organization_no,
      customer_no: __customer_no,
      customer_group_no: __customer_group_no,
      insurance_company: insuranceCompanyID || "",
      clinicalEntityNo,
    };

    const { printData, loggerValue, resultData } =
      await createBaseFetchExsysDataAndCallNphiesApi({
        exsysQueryApiId: queryEligibilityDataFromCchi,
        requestParams: exsysApiParams,
        requestMethod: "GET",
        printFolderName: `${printFolderName}/eligibility`,
        exsysDataApiPrimaryKeyName: "memberid",
        createNphiesRequestPayloadFn,
        extractionFunctionsMap,
        setErrorIfExtractedDataFoundFn,
        noPatientDataLogger: true,
        createResultsDataFromExsysResponse: (result) => ({
          ...baseEligibilityData,
          ...result,
        }),
      });

    const { nphiesExtractedData } = resultData || {};

    const {
      nodeServerDataSentToNphies,
      nphiesResponse,
      ...otherNphiesExtractedData
    } = nphiesExtractedData || {};

    if (printValues) {
      const { data, hasNphiesApiError, folderName } = printData;
      await writeResultFile({
        data: {
          originalApiParams: body,
          hasNphiesApiError,
          loggerValue,
          ...data,
        },
        folderName,
      });
    }

    const frontEndEligibilityData = extractEligibilityDataSentToNphies({
      nodeServerDataSentToNaphies: nodeServerDataSentToNphies,
      nphiesResponse,
      nphiesExtractedData: otherNphiesExtractedData,
    });

    return {
      data: {
        ...baseResponse,
        frontEndEligibilityData,
      },
    };
  }

  return {
    data: baseResponse,
  };
});
