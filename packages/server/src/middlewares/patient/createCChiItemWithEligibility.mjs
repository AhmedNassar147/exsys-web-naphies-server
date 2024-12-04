/*
 *
 * Helper: `createCChiItemWithEligibility`.
 *
 */
import {
  isArrayHasData,
  createDateFromNativeDate,
} from "@exsys-web-server/helpers";
import createExsysRequest from "../../helpers/createExsysRequest.mjs";
import createNphiesRequestPayloadFn from "../../nphiesHelpers/eligibility/index.mjs";
import createBaseFetchExsysDataAndCallNphiesApi from "../../exsysHelpers/createBaseFetchExsysDataAndCallNphiesApi.mjs";
import extractEligibilityDataSentToNphies from "../../exsysToFrontEndHelpers/eligibility/index.mjs";
import {
  EXSYS_API_IDS_NAMES,
  NPHIES_REQUEST_TYPES,
  TEST_PATIENT_NAME,
} from "../../constants.mjs";

const { queryEligibilityDataFromCchi, queryExsysCchiPatient } =
  EXSYS_API_IDS_NAMES;
const { ELIGIBILITY } = NPHIES_REQUEST_TYPES;

const setErrorIfExtractedDataFoundFn = ({
  eligibilityErrors,
  coverageErrors,
}) => [...(eligibilityErrors || []), ...(coverageErrors || [])];

const makeNphiesGenderName = (gender) =>
  gender ? (gender === "1" ? "male" : "female") : "";

const createCChiItemWithEligibility = async ({
  authorization,
  organization_no,
  clinicalEntityNo,
  beneficiaryKey,
  customer_no,
  customer_group_no,
  cchiItem,
  genderCodeFromBody,
  dateOfBirthFromBody,
  beneficiaryNumberFromBody,
  mobileFromBody,
  firstName,
  secondName,
  thirdName,
  lastName,
  printFolderName,
}) => {
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
    insuranceCompanyEN,
  } = cchiItem || {};

  const __genderCode = gender || genderCodeFromBody;
  const __nationalityCode = nationalityCode || nationalityID || nationality;

  const insuranceCompanyId = insuranceCompanyID;

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
      insuranceCompanyId,
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
    customerGroupName,
    dateOfBirth,
    patientFileNo,
    customerContracts,
    // patientCardNo: exsysPatientCardNo,
  } = exsysCchiPatientData;

  const __customer_no = customer_no || customerNo || "";
  const __customer_group_no = customer_group_no || customerGroupNo || "";

  const mockedDateOfBirth = dateOfBirthFromBody || "01-12-1970";

  const __dateOfBirth =
    dateOfBirth ||
    createDateFromNativeDate(insuranceDateOfBirth || mockedDateOfBirth, {
      returnReversedDate: !!mockedDateOfBirth,
    }).dateString;

  const mainGender = genderName || makeNphiesGenderName(__genderCode);

  const shouldCallEligibilityApi = !!(
    organization_no &&
    __customer_no &&
    __customer_group_no
  );

  const _identityNumber = identityNumber || beneficiaryKey;

  const [
    patient_first_name,
    patient_second_name,
    patient_third_name,
    patient_family_name,
  ] = (name || "").split(" ");

  const patientName = [
    patient_first_name || firstName || TEST_PATIENT_NAME.firstName,
    patient_second_name || secondName || TEST_PATIENT_NAME.secondName,
    patient_third_name || thirdName || TEST_PATIENT_NAME.thirdName,
    patient_family_name || lastName || TEST_PATIENT_NAME.familyName,
  ].join(" ");

  const nextCchiItem = {
    ...(cchiItem || null),
    name: patientName,
    nationalityCode: exsysNationalityCode || __nationalityCode,
    nationality: nationalityName || "",
    dateOfBirth: __dateOfBirth,
    gender: mainGender,
    genderCode: genderCode || __genderCode,
    beneficiaryNumber,
    identityNumber: _identityNumber,
    insuranceCompanyEN: insuranceCompanyEN || customerGroupName,
  };

  const baseResponse = {
    customerNo: __customer_no,
    customerGroupNo: __customer_group_no,
    hasPatientFileNo: !!patientFileNo,
    hasExsysCustomersList: isArrayHasData(customerContracts),
    exsysCchiPatientData,
    nextCchiItem,
  };

  if (!shouldCallEligibilityApi) {
    return {
      ...baseResponse,
      error: "Please select customer, customer-group and add card no",
    };
  }

  const patientFileNoOrMemberId =
    beneficiaryNumber || beneficiaryNumberFromBody || beneficiaryKey;

  // const patientFileNoOrMemberId =
  // beneficiaryNumber || beneficiaryNumberFromBody || exsysPatientCardNo || beneficiaryKey;

  const _policyNumber = policyNumber || "00000000";
  const _className = className || "class A+";
  const _policyHolder = policyHolder || "policy holder test";

  const baseEligibilityData = {
    patient_first_name: patientName[0],
    patient_second_name: patientName[1],
    patient_third_name: patientName[2],
    patient_family_name: patientName[3],
    patient_file_no: patientFileNoOrMemberId,
    memberid: patientFileNoOrMemberId,
    iqama_no: _identityNumber,
    patient_phone: mobileNumber || mobileFromBody || "",
    gender: mainGender || "male",
    birthDate: __dateOfBirth,
    relationship: "self",
    classPolicyNo: _policyNumber,
    className: _className,
    policyHolderLicense: _policyNumber,
    policyHolderName: _policyHolder,
    occupationCode: "others",
    patient_martial_status: "U",
  };

  const exsysApiParams = {
    authorization,
    organization_no,
    customer_no: __customer_no || "",
    customer_group_no: __customer_group_no || "",
    insurance_company: insuranceCompanyId || "",
    clinicalEntityNo: clinicalEntityNo,
  };

  const { printData, resultData } =
    await createBaseFetchExsysDataAndCallNphiesApi({
      exsysQueryApiId: queryEligibilityDataFromCchi,
      requestParams: exsysApiParams,
      requestMethod: "GET",
      extractionRequestType: ELIGIBILITY,
      printFolderName: `${printFolderName}/eligibility`,
      exsysDataApiPrimaryKeyName: "memberid",
      createNphiesRequestPayloadFn,
      setErrorIfExtractedDataFoundFn,
      noPatientDataLogger: true,
      checkExsysDataValidationBeforeCallingNphies: ({
        payer_license,
        insurance_company_payer_license,
      }) => {
        if (
          insurance_company_payer_license &&
          payer_license !== insurance_company_payer_license
        ) {
          return {
            loggerMessage:
              "Error, because payer license is different from registered payer license",
          };
        }

        return {};
      },
      createResultsDataFromExsysResponse: (result) => ({
        ...baseEligibilityData,
        ...result,
      }),
    });

  const { data } = printData;
  const { loggerMessage } = data || {};
  const { nphiesExtractedData } = resultData || {};

  const {
    nodeServerDataSentToNphies,
    nphiesResponse,
    ...otherNphiesExtractedData
  } = nphiesExtractedData || {};

  const frontEndEligibilityData = extractEligibilityDataSentToNphies({
    nodeServerDataSentToNaphies: nodeServerDataSentToNphies,
    nphiesResponse,
    nphiesExtractedData: otherNphiesExtractedData,
  });

  const { outcome, disposition } = frontEndEligibilityData;

  const isMemberidNotValid = (disposition || "").includes(
    "Member ID is invalid"
  );

  const isErrorOutcome = outcome === "error";

  const error =
    (isMemberidNotValid
      ? "Please enter card no then make a new request"
      : loggerMessage) || "";

  return {
    ...baseResponse,
    error,
    isErrorOutcome,
    nextCchiItem: {
      ...nextCchiItem,
      frontEndEligibilityData,
    },
  };
};

export default createCChiItemWithEligibility;
