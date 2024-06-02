/*
 *
 * Middleware: `checkPatientInsuranceMiddleware`.
 *
 */
import {
  writeResultFile,
  getCurrentDate,
  isArrayHasData,
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
    clinicalEntityNo,
  } = body;

  const systemType = _systemType || "1";

  const printFolderName = `CCHI/${beneficiaryKey}/${systemType}`;

  const { apiResults, isSuccess } = await checkNphiesPatientInsurance({
    patientKey: beneficiaryKey,
    systemType,
    printValues,
    printFolderName,
    organizationNo: organization_no,
    clinicalEntityNo,
  });
  const { insurance, errorCode, errorDescription } = apiResults;

  const hasError =
    !!(errorCode || errorDescription) || !isArrayHasData(insurance);

  const isCCHITotallySuccesseded = !!isSuccess && !hasError;

  const [firstItem] = insurance || [];

  const {
    name,
    identityNumber,
    gender,
    dateOfBirth,
    mobileNumber,
    insuranceCompanyID,
    beneficiaryNumber,
    nationalityCode,
    nationalityID,
    nationality,
    policyNumber,
    className,
  } = firstItem || {};

  const { result: cchiPatientResult } = await createExsysRequest({
    resourceName: queryExsysCchiPatient,
    requestMethod: "GET",
    retryTimes: 0,
    requestParams: {
      beneficiaryKey,
      nationalityCode: nationalityCode || nationalityID || nationality,
      gender,
      insuranceCompanyId: insuranceCompanyID,
      policyNumber,
      className,
    },
  });

  const { data: cchiPatientResultData } = cchiPatientResult || {};

  const {
    nationalityCode: exsysNationalityCode,
    nationalityName,
    genderCode,
    genderName,
    customerNo,
    customerGroupNo,
    birthDate,
  } = cchiPatientResultData || {};

  const __customer_no = customer_no || customerNo;
  const __customer_group_no = customer_group_no || customerGroupNo;

  const shouldCallEligibilityApi =
    isCCHITotallySuccesseded &&
    !!(organization_no && __customer_no && __customer_group_no);

  const __insuranceData = isArrayHasData(insurance)
    ? insurance.map((item) => ({
        ...item,
        nationalityCode: exsysNationalityCode,
        nationality: nationalityName,
        dateOfBirth: birthDate,
        gender: genderName,
        genderCode,
      }))
    : [];

  if (shouldCallEligibilityApi) {
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
      patient_file_no: beneficiaryNumber,
      memberid: beneficiaryNumber,
      iqama_no: identityNumber || beneficiaryKey,
      patient_phone: mobileNumber,
      gender: (
        genderName || (gender === "1" ? "male" : "female")
      ).toLowerCase(),
      birthDate: dateOfBirth || birthDate,
      // birthDate: dateOfBirth || birthDate || dateString,
      relationship: "self",
    };

    const exsysApiParams = {
      authorization,
      organization_no,
      customer_no: __customer_no,
      customer_group_no: __customer_group_no,
      insurance_company: insuranceCompanyID,
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
      nphiesExtractedData,
    });

    return {
      data: {
        errorCode,
        errorDescription,
        insurance: __insuranceData,
        customerNo: __customer_no,
        customerGroupNo: __customer_group_no,
        frontEndEligibilityData,
      },
    };
  }

  return {
    data: {
      errorCode,
      errorDescription,
      insurance: __insuranceData,
      customerNo: __customer_no,
      customerGroupNo: __customer_group_no,
    },
  };
});
