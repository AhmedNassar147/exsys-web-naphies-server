/*
 *
 * Middleware: `checkPatientInsuranceMiddleware`.
 *
 */
import { writeResultFile, isArrayHasData } from "@exsys-web-server/helpers";
import checkPatientInsuranceMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";
import createCChiItemWithEligibility from "./createCChiItemWithEligibility.mjs";
import checkNphiesPatientInsurance from "../../exsysHelpers/checkNphiesPatientInsurance.mjs";

export default checkPatientInsuranceMiddleware(async (body) => {
  const {
    authorization,
    printValues = false,
    beneficiaryKey,
    isReferral,
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
    requestIndex,
    shouldCallEligibilityWithoutCchi,
  } = body;

  const clinicalEntityNo = __clinicalEntityNo || "";

  const systemType = _systemType || "1";

  const printFolderName = `CCHI/${beneficiaryKey}/${systemType}`;

  const { apiResults, cchiOriginalResults } = await checkNphiesPatientInsurance(
    {
      patientKey: beneficiaryKey,
      systemType,
      printValues,
      printFolderName,
      organizationNo: organization_no,
      clinicalEntityNo,
    }
  );

  const { insurance, errorCode, errorDescription, transactionName } =
    apiResults;

  let _insuranceData = isArrayHasData(insurance) ? insurance : [{}];

  if (shouldCallEligibilityWithoutCchi) {
    _insuranceData = [{}, ..._insuranceData];
  }

  const insuranceWithEligibilityResults = await Promise.allSettled(
    _insuranceData.map((cchiItem, index) =>
      createCChiItemWithEligibility({
        authorization,
        organization_no,
        beneficiaryKey,
        isReferral,
        clinicalEntityNo,
        ...(requestIndex === index || shouldCallEligibilityWithoutCchi
          ? {
              customer_no,
              customer_group_no,
            }
          : null),
        cchiItem,
        genderCodeFromBody,
        insuranceCompanyIdFromBody,
        dateOfBirthFromBody,
        beneficiaryNumberFromBody,
        mobileFromBody,
        firstName,
        secondName,
        thirdName,
        lastName,
        printFolderName,
      })
    )
  );

  const cchiRequestHasOnlyOneRecord =
    insuranceWithEligibilityResults.length === 1;

  const result = insuranceWithEligibilityResults.reduce(
    (acc, { value }) => {
      if (value) {
        const {
          nextCchiItem,
          error,
          isErrorOutcome,
          customerNo,
          customerGroupNo,
          hasPatientFileNo,
          hasExsysCustomersList,
          ...otherValues
        } = value;

        if (!acc.openPmiModal) {
          acc.openPmiModal = !hasPatientFileNo;
        }

        if (!acc.hasExsysCustomersList) {
          acc.hasExsysCustomersList = hasExsysCustomersList;
        }

        if (!acc.hasAnyErrors) {
          acc.hasAnyErrors = isErrorOutcome || !!error;
        }

        if (!acc.moreOptionsShown && error) {
          acc.moreOptionsShown = error.includes("card no");
        }

        if (cchiRequestHasOnlyOneRecord) {
          acc.customerNo = customerNo;
          acc.customerGroupNo = customerGroupNo;
        }

        acc.insuranceWithEligibilityData.push({
          ...nextCchiItem,
          error,
          isErrorOutcome,
          customerNo,
          customerGroupNo,
          hasPatientFileNo,
          hasExsysCustomersList,
          ...otherValues,
        });
      }

      return acc;
    },
    {
      insuranceWithEligibilityData: [],
      openPmiModal: false,
      hasExsysCustomersList: false,
      hasAnyErrors: false,
      customerNo: undefined,
      customerGroupNo: undefined,
      moreOptionsShown: false,
    }
  );

  const finalResult = {
    data: {
      errorCode,
      errorDescription,
      transactionName,
      cchiOriginalResults,
      requestIndex,
      cchiRequestHasOnlyOneRecord,
      ...result,
    },
  };

  if (printValues) {
    await writeResultFile({
      folderName: printFolderName,
      data: finalResult,
    });
  }

  return finalResult;
});
