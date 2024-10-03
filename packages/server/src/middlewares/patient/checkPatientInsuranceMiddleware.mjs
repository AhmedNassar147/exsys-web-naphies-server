/*
 *
 * Middleware: `checkPatientInsuranceMiddleware`.
 *
 */
import {
  writeResultFile,
  // getCurrentDate,
  isArrayHasData,
  createDateFromNativeDate,
} from "@exsys-web-server/helpers";
import extractEligibilityResponseData from "../../nphiesHelpers/extraction/extractEligibilityResponseData.mjs";
import extractCoverageData from "../../nphiesHelpers/extraction/extractCoverageData.mjs";
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
  CoverageEligibilityResponse: extractEligibilityResponseData,
  Coverage: extractCoverageData,
};

const setErrorIfExtractedDataFoundFn = ({
  eligibilityErrors,
  coverageErrors,
}) => [...(eligibilityErrors || []), ...(coverageErrors || [])];

const makeNphiesGenderName = (gender) =>
  gender ? (gender === "1" ? "male" : "female") : "";

const checkInsuranceEligibility = async ({
  firstName,
  secondName,
  thirdName,
  familyName,
  patientFileNoOrMemberId,
  beneficiaryKey,
  mobileNumber,
  genderName,
  dateOfBirth,
  authorization,
  organization_no,
  customer_no,
  customer_group_no,
  policyNumber,
  className,
  policyHolder,
  insuranceCompanyID,
  clinicalEntityNo,
  printFolderName,
  originalApiParams,
  printValues,
}) => {
  const baseEligibilityData = {
    patient_first_name: firstName || "",
    patient_second_name: secondName || "",
    patient_third_name: thirdName || "",
    patient_family_name: familyName || "",
    patient_file_no: patientFileNoOrMemberId,
    memberid: patientFileNoOrMemberId,
    iqama_no: beneficiaryKey,
    patient_phone: mobileNumber,
    gender: genderName,
    birthDate: dateOfBirth || "1900-01-01",
    relationship: "self",
    classPolicyNo: policyNumber,
    className,
    policyHolderLicense: policyNumber,
    policyHolderName: policyHolder,
    occupationCode: "others",
    patient_martial_status: "U",
  };

  const exsysApiParams = {
    authorization,
    organization_no,
    customer_no: customer_no || "",
    customer_group_no: customer_group_no || "",
    insurance_company: insuranceCompanyID || "",
    clinicalEntityNo: clinicalEntityNo,
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
        originalApiParams: originalApiParams,
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

  return frontEndEligibilityData;
};

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
    firstName,
    secondName,
    thirdName,
    lastName,
    beneficiaryNumber: beneficiaryNumberFromBody,
    gender: genderCodeFromBody,
    dateOfBirth: dateOfBirthFromBody,
    mobileNumber: mobileFromBody,
    insuranceCompanyId: insuranceCompanyIdFromBody,
  } = body;

  const clinicalEntityNo = __clinicalEntityNo || "";

  const systemType = _systemType || "1";

  const printFolderName = `CCHI/${beneficiaryKey}/${systemType}`;

  const { apiResults, cchiOriginalResults, isCCHITotallySuccesseded } =
    await checkNphiesPatientInsurance({
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
    policyHolder,
  } = firstItem || {};

  const __genderCode = gender || genderCodeFromBody;
  const __nationalityCode = nationalityCode || nationalityID || nationality;

  const { result } = await createExsysRequest({
    resourceName: queryExsysCchiPatient,
    requestMethod: "GET",
    retryTimes: 0,
    requestParams: {
      authorization,
      organization_no,
      beneficiaryId: beneficiaryKey,
      nationalityCode: __nationalityCode,
      gender: __genderCode,
      insuranceCompanyId: insuranceCompanyID || insuranceCompanyIdFromBody,
      policyNumber,
      className: (className || "")
        .replace(/\s{1,}/g, " ")
        .split(" ")
        .filter((v) => v !== "class")
        .join(" "),
    },
  });

  const { data: __data } = result || {};
  const exsysCchiPatientData = __data || {};

  const {
    nationalityCode: exsysNationalityCode,
    nationality: nationalityName,
    gender: genderName,
    genderCode,
    customerNo,
    customerGroupNo,
    dateOfBirth,
    patientCardNo: exsysPatientCardNo,
  } = exsysCchiPatientData;

  const __customer_no = customer_no || customerNo || "";
  const __customer_group_no = customer_group_no || customerGroupNo || "";

  const mockedDateOfBirth = dateOfBirthFromBody || "01-12-1970";

  const __dateOfBirth =
    dateOfBirth ||
    createDateFromNativeDate(insuranceDateOfBirth || mockedDateOfBirth, {
      returnReversedDate: !!mockedDateOfBirth,
    }).dateString;

  const mainGender = genderName || makeNphiesGenderName(__genderCode) || "";

  const __insuranceData = isArrayHasData(insurance)
    ? insurance.map((item) => ({
        ...item,
        nationalityCode: exsysNationalityCode || __nationalityCode,
        nationality: nationalityName || "",
        dateOfBirth: __dateOfBirth,
        gender: mainGender,
        genderCode: genderCode || __genderCode,
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

  const shouldCallEligibilityApi = !!(
    organization_no &&
    __customer_no &&
    __customer_group_no
  );

  if (!shouldCallEligibilityApi) {
    return {
      data: {
        ...baseResponse,
        notificationError:
          "Please select customer, customer-group and add card no",
      },
    };
  }

  const patientFileNoOrMemberId =
    beneficiaryNumber ||
    beneficiaryNumberFromBody ||
    exsysPatientCardNo ||
    beneficiaryKey;

  if (shouldCallEligibilityApi) {
    const [
      patient_first_name,
      patient_second_name,
      patient_third_name,
      patient_family_name,
    ] = (name || "").split(" ");

    const __beneficiaryKey = identityNumber || beneficiaryKey;

    const frontEndEligibilityData = await checkInsuranceEligibility({
      firstName: patient_first_name || firstName || "No",
      secondName: patient_second_name || secondName || "Name",
      thirdName: patient_third_name || thirdName || "",
      familyName: patient_family_name || lastName || "",
      patientFileNoOrMemberId,
      beneficiaryKey: __beneficiaryKey,
      mobileNumber: mobileNumber || mobileFromBody || "",
      genderName: mainGender || "male",
      dateOfBirth: __dateOfBirth,
      policyNumber: policyNumber || "00000000",
      className: className || "class A+",
      policyHolder: policyHolder || "policy holder test",
      authorization,
      organization_no,
      customer_no: __customer_no,
      customer_group_no: __customer_group_no,
      insurance_company: insuranceCompanyID,
      clinicalEntityNo,
      printFolderName,
      originalApiParams: body,
      printValues,
    });

    const { outcome, disposition } = frontEndEligibilityData;
    const isMemberidNotValid = (disposition || "").includes(
      "Member ID is invalid"
    );

    return {
      data: {
        ...baseResponse,
        isErrorOutcome: outcome === "error",
        notificationError: isMemberidNotValid
          ? "Please enter card no then make a new request"
          : "",
        frontEndEligibilityData,
      },
    };
  }

  return {
    data: baseResponse,
  };
});
