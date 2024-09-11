/*
 *
 * Helper: `createNaphiesEligibilityRequestFullData`.
 *
 */
import { createUUID } from "@exsys-web-server/helpers";
import createProviderUrls from "../base/createProviderUrls.mjs";
import createNphiesBaseRequestData from "../base/createNphiesBaseRequestData.mjs";
import createNphiesMessageHeader from "../base/createNphiesMessageHeader.mjs";
import createNphiesDoctorOrPatientData from "../base/createNphiesDoctorOrPatientData.mjs";
import createNphiesCoverage from "../base/createNphiesCoverage.mjs";
import createLocationData from "../base/createLocationData.mjs";
import createAllOrganizationEntries from "../base/createAllOrganizationEntries.mjs";
import createCoverageEligibilityRequest from "./createCoverageEligibilityRequest.mjs";
import { NPHIES_REQUEST_TYPES, ELIGIBILITY_TYPES } from "../../constants.mjs";

const { ELIGIBILITY } = NPHIES_REQUEST_TYPES;

const ELIGIBILITY_TYPES_MAP = {
  [ELIGIBILITY_TYPES.benefits]: [
    ELIGIBILITY_TYPES.benefits,
    ELIGIBILITY_TYPES.discovery,
  ],
  [ELIGIBILITY_TYPES.discovery]: [
    ELIGIBILITY_TYPES.benefits,
    ELIGIBILITY_TYPES.discovery,
  ],
  [ELIGIBILITY_TYPES.validation]: [
    ELIGIBILITY_TYPES.benefits,
    ELIGIBILITY_TYPES.validation,
  ],
};

const createNaphiesEligibilityRequestFullData = ({
  provider_license,
  payer_license,
  payer_child_license,
  site_url,
  is_referral,
  site_name,
  provider_organization,
  payer_organization,
  payer_name,
  provider_location,
  location_license,
  payer_base_url,
  coverage_type,
  memberid,
  patient_file_no,
  iqama_no,
  national_id_type,
  patient_first_name,
  patient_second_name,
  patient_third_name,
  patient_family_name,
  patient_phone,
  gender,
  birthDate,
  patient_martial_status,
  relationship,
  period_start_date,
  period_end_date,
  business_arrangement,
  network_name,
  classes,
  className,
  classPolicyNo,
  occupationCode,
  religion,
  message_event_type,
  providerTypeCode,
  providerTypeDisplay,
  policyHolderLicense,
  policyHolderName,
  policyHolderReference,
}) => {
  const {
    providerPatientUrl,
    providerCoverageUrl,
    providerOrganizationUrl,
    providerFocusUrl,
    providerLocationUrl,
  } = createProviderUrls({
    providerBaseUrl: site_url,
    requestType: ELIGIBILITY,
  });

  const requestId = createUUID();

  const purpose =
    ELIGIBILITY_TYPES_MAP[message_event_type] ||
    ELIGIBILITY_TYPES_MAP[ELIGIBILITY_TYPES.validation];

  const requestPayload = {
    ...createNphiesBaseRequestData(),
    entry: [
      createNphiesMessageHeader({
        providerLicense: provider_license,
        payerLicense: payer_license,
        providerOrganizationUrl,
        requestId,
        providerFocusUrl,
        requestType: ELIGIBILITY,
      }),
      createCoverageEligibilityRequest({
        requestId,
        purpose,
        providerOrganization: provider_organization,
        payerOrganization: payer_organization,
        providerLocation: provider_location,
        periodStartDate: period_start_date,
        periodEndDate: period_end_date,
        patientId: patient_file_no,
        businessArrangement: business_arrangement,
        isReferral: is_referral === "Y",
        providerPatientUrl,
        providerOrganizationUrl,
        providerCoverageUrl,
        providerFocusUrl,
        providerLocationUrl,
      }),
      createNphiesCoverage({
        requestId,
        coverageType: coverage_type,
        memberId: memberid,
        patientId: patient_file_no,
        relationship,
        payerOrganization: payer_organization,
        payerBaseUrl: payer_base_url,
        providerOrganizationUrl,
        providerPatientUrl,
        providerCoverageUrl,
        networkName: network_name,
        className,
        classPolicyNo,
        classes,
        policyHolderReference,
      }),
      ...createAllOrganizationEntries({
        organizationLicense: provider_license,
        organizationReference: provider_organization,
        siteName: site_name,
        providerOrganizationUrl,
        providerTypeCode,
        providerTypeDisplay,
        payerLicense: payer_child_license || payer_license,
        payerReference: payer_organization,
        payerName: payer_name,
        policyHolderLicense,
        policyHolderName,
        policyHolderReference,
      }),
      createNphiesDoctorOrPatientData({
        patientOrDoctorId: patient_file_no,
        identifierId: iqama_no,
        identifierIdType: national_id_type,
        firstName: patient_first_name,
        secondName: patient_second_name,
        thirdName: patient_third_name,
        familyName: patient_family_name,
        staffPhone: patient_phone,
        gender,
        occupationCode,
        religion,
        patientBirthdate: birthDate,
        patientMaritalStatus: patient_martial_status,
        providerDoctorOrPatientUrl: providerPatientUrl,
      }),

      createLocationData({
        locationLicense: location_license,
        siteName: site_name,
        providerLocation: provider_location,
        providerOrganization: provider_organization,
        providerLocationUrl,
        providerOrganizationUrl,
      }),
    ].filter(Boolean),
  };

  return requestPayload;
};

export default createNaphiesEligibilityRequestFullData;
