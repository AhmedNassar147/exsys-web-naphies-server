/*
 *
 * Helper: `createNaphiesCommunicationResponseFullData`.
 *
 */
import { createUUID } from "@exsys-web-server/helpers";
import createProviderUrls from "../base/createProviderUrls.mjs";
import createNphiesBaseRequestData from "../base/createNphiesBaseRequestData.mjs";
import createNphiesMessageHeader from "../base/createNphiesMessageHeader.mjs";
import createNphiesDoctorOrPatientData from "../base/createNphiesDoctorOrPatientData.mjs";
import createOrganizationData from "../base/createOrganizationData.mjs";
import createCommunicationEntry from "./createCommunicationEntry.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const { COMMUNICATION } = NPHIES_REQUEST_TYPES;

const createNaphiesCommunicationResponseFullData = ({
  provider_license,
  payer_license,
  payer_child_license,
  site_url,
  site_name,
  provider_organization,
  payer_organization,
  payer_name,
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
  communication_status,
  communication_category,
  communication_response_basedon_type,
  communication_response_basedon_id,
  communication_priority,
  communication_about_type,
  communication_about_id,
  communication_about_system_type,
  communication_payload,
}) => {
  const { providerPatientUrl, providerOrganizationUrl, providerFocusUrl } =
    createProviderUrls({
      providerBaseUrl: site_url,
      requestType: COMMUNICATION,
    });

  const baseData = createNphiesBaseRequestData();
  const requestId = createUUID();

  const requestPayload = {
    ...baseData,
    entry: [
      createNphiesMessageHeader({
        providerLicense: provider_license,
        payerLicense: payer_license,
        requestId,
        providerFocusUrl,
        requestType: COMMUNICATION,
      }),
      createCommunicationEntry({
        requestId,
        providerFocusUrl,
        providerPatientUrl,
        providerOrganizationUrl,
        siteUrl: site_url,
        patientId: patient_file_no,
        payerOrganization: payer_organization,
        providerOrganization: provider_organization,
        communicationStatus: communication_status,
        communicationCategory: communication_category,
        communicationResponseBasedOnType: communication_response_basedon_type,
        communicationResponseBasedOnId: communication_response_basedon_id,
        communicationPriority: communication_priority,
        communicationAboutType: communication_about_type,
        communicationAboutId: communication_about_id,
        communicationAboutSystemType: communication_about_system_type,
        communicationPayload: communication_payload,
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
        patientBirthdate: birthDate,
        patientMaritalStatus: patient_martial_status,
        providerDoctorOrPatientUrl: providerPatientUrl,
      }),
      createOrganizationData({
        organizationLicense: provider_license,
        organizationReference: provider_organization,
        siteName: site_name,
        providerOrganizationUrl,
        isProvider: true,
      }),
      createOrganizationData({
        organizationLicense: payer_child_license || payer_license,
        organizationReference: payer_organization,
        siteName: payer_name,
        providerOrganizationUrl,
      }),
    ].filter(Boolean),
  };

  return requestPayload;
};

export default createNaphiesCommunicationResponseFullData;
