/*
 *
 * Middleware: `checkPatientInsuranceMiddleware`.
 *
 */
import { writeResultFile, getCurrentDate } from "@exsys-web-server/helpers";
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
  } = body;

  const systemType = _systemType || "1";

  const printFolderName = `CCHI/${beneficiaryKey}/${systemType}`;

  const { apiResults, isSuccess } = await checkNphiesPatientInsurance({
    patientKey: beneficiaryKey,
    systemType,
    printValues,
    printFolderName,
  });

  const shouldCallEligibilityApi =
    !!isSuccess && !!(organization_no && customer_no && customer_group_no);

  if (shouldCallEligibilityApi) {
    const { insurance } = apiResults;

    const [
      {
        name,
        identityNumber,
        gender,
        dateOfBirth,
        mobileNumber,
        insuranceCompanyID,
        beneficiaryNumber,
      },
    ] = insurance;

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
      iqama_no: identityNumber,
      patient_phone: mobileNumber,
      gender: gender === "1" ? "male" : "female",
      birthDate: dateOfBirth || dateString,
      relationship: "self",
    };

    const exsysApiParams = {
      authorization,
      organization_no,
      customer_no,
      customer_group_no,
      insurance_company: insuranceCompanyID,
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
