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

const { queryEligibilityDataFromCchi } = EXSYS_API_IDS_NAMES;

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

    // for check  Eligibility
    firstName,
    secondName,
    thirdName,
    lastName,
    gender: __gender,
    dateOfBirth: __dob,
    mobileNumber: __phone,
    insuranceCompanyId: __insuranceCompanyId,
    beneficiaryNumber: __beneficiaryNo,
    clinicalEntityNo,
    clientName,
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
    clientName,
  });
  const { insurance, errorCode, errorDescription } = apiResults;

  const hasError =
    !!(errorCode || errorDescription) || !isArrayHasData(insurance);

  const isCCHITotallySuccesseded = !!isSuccess && !hasError;

  const hasEligibilityCheckingParams = [
    firstName,
    secondName,
    thirdName,
    lastName,
    __gender,
    __dob,
    __phone,
    __insuranceCompanyId,
    __beneficiaryNo,
  ].every(Boolean);

  const shouldCallEligibilityApi =
    (isCCHITotallySuccesseded || hasEligibilityCheckingParams) &&
    !!(organization_no && customer_no && customer_group_no);

  if (shouldCallEligibilityApi) {
    const [firstItem] = insurance || [];

    const {
      name,
      identityNumber,
      gender,
      dateOfBirth,
      mobileNumber,
      insuranceCompanyID,
      beneficiaryNumber,
    } = firstItem || {};

    const [
      patient_first_name,
      patient_second_name,
      patient_third_name,
      patient_family_name,
    ] = (name || "").split(" ");
    const { dateString } = getCurrentDate(true);

    const curredGender = gender || __gender;

    const baseEligibilityData = {
      patient_first_name: patient_first_name || firstName || "",
      patient_second_name: patient_second_name || secondName || "",
      patient_third_name: patient_third_name || thirdName || "",
      patient_family_name: patient_family_name || lastName || "",
      patient_file_no: beneficiaryNumber || __beneficiaryNo,
      memberid: beneficiaryNumber || __beneficiaryNo,
      iqama_no: identityNumber || beneficiaryKey,
      patient_phone: mobileNumber || __phone,
      gender: curredGender === "1" ? "male" : "female",
      birthDate: dateOfBirth || __dob || dateString,
      relationship: "self",
    };

    const exsysApiParams = {
      authorization,
      organization_no,
      customer_no,
      customer_group_no,
      insurance_company: insuranceCompanyID || __insuranceCompanyId,
      clinicalEntityNo,
      clientName,
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
        ...(apiResults || null),
        frontEndEligibilityData,
      },
    };
  }

  return {
    data: apiResults || {},
  };
});
