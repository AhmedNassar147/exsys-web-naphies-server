/*
 *
 * Helper: `createNaphiesPreauthRequestFullData`.
 *
 */
import { writeResultFile, isArrayHasData } from "@exsys-web-server/helpers";
import createProviderUrls from "../base/createProviderUrls.mjs";
import createNphiesBaseRequestData from "../base/createNphiesBaseRequestData.mjs";
import createNphiesMessageHeader from "../base/createNphiesMessageHeader.mjs";
import createNphiesDoctorOrPatientData from "../base/createNphiesDoctorOrPatientData.mjs";
import createNphiesCoverage from "../base/createNphiesCoverage.mjs";
import createOrganizationData from "../base/createOrganizationData.mjs";
import createNphiesClaimData from "./createNphiesClaimData.mjs";
import createNphiesVisionPrescriptionData from "./createNphiesVisionPrescriptionData.mjs";
// import createCoverageEligibilityRequest from "./createCoverageEligibilityRequest.mjs";
// import createLocationData from "./createLocationData.mjs";
import { NPHIES_REQUEST_TYPES } from "../../constants.mjs";

const { PREAUTH } = NPHIES_REQUEST_TYPES;

const createNaphiesPreauthRequestFullData = ({
  provider_license,
  request_id,
  payer_license,
  payer_child_license,
  site_url,
  site_tel,
  site_name,
  provider_organization,
  payer_organization,
  payer_name,
  payer_base_url,
  coverage_type,
  coveragePeriodStart,
  coveragePeriodEnd,
  member_id,
  patient_id,
  national_id,
  national_id_type,
  staff_first_name,
  staff_family_name,
  gender,
  birthDate,
  patient_martial_status,
  subscriber_patient_id,
  subscriber_national_id,
  subscriber_national_id_type,
  subscriber_staff_first_name,
  subscriber_staff_family_name,
  subscriber_gender,
  subscriber_birthDate,
  subscriber_martial_status,
  subscriber_tel,
  relationship,
  network_name,
  classes,
  business_arrangement,
  visionPrescriptionId,
  visionPrescriptionCreatedAt,
  visionLensSpecification,
  preauthType,
  supportingInfo,
  doctorsData,
  productsData,
  diagnosisData,
}) => {
  const {
    providerPatientUrl,
    providerDoctorUrl,
    providerCoverageUrl,
    providerOrganizationUrl,
    providerFocusUrl,
    visionPrescriptionUrl,
  } = createProviderUrls({
    providerBaseUrl: site_url,
    requestType: PREAUTH,
  });

  const baseData = createNphiesBaseRequestData();
  const hasDoctorsData = isArrayHasData(doctorsData);
  const buildVisionPrescription = !!(
    visionPrescriptionId && visionPrescriptionCreatedAt
  );

  const primaryDoctorIndex = hasDoctorsData
    ? doctorsData.findIndex(({ roleCode }) => roleCode === "primary")
    : -1;

  const isPrimaryDoctorIndexFound = primaryDoctorIndex !== -1;

  const { id: primaryDoctorId } = isPrimaryDoctorIndexFound
    ? doctorsData[primaryDoctorIndex]
    : {};

  const requestPayload = {
    ...baseData,
    entry: [
      createNphiesMessageHeader({
        providerLicense: provider_license,
        payerLicense: payer_license,
        requestId: request_id,
        providerFocusUrl,
        requestType: PREAUTH,
      }),
      createNphiesClaimData({
        requestId: request_id,
        providerOrganization: provider_organization,
        payerOrganization: payer_organization,
        patientId: patient_id,
        businessArrangement: business_arrangement,
        providerPatientUrl,
        providerOrganizationUrl,
        providerCoverageUrl,
        providerFocusUrl,
        siteUrl: site_url,
        visionPrescriptionUrl,
        useVisionPrescriptionUrl: buildVisionPrescription,
        hasDoctorsData,
        primaryDoctorSequence: isPrimaryDoctorIndexFound
          ? primaryDoctorIndex + 1
          : undefined,
        primaryDoctorFocal: isPrimaryDoctorIndexFound ? true : undefined,
        providerDoctorUrl,
        preauthType,
        supportingInfo,
        doctorsData,
        productsData,
        diagnosisData,
      }),
      createNphiesDoctorOrPatientData({
        patientOrDoctorId: patient_id,
        identifierId: national_id,
        identifierIdType: national_id_type,
        staffFirstName: staff_first_name,
        staffFamilyName: staff_family_name,
        staffPhone: site_tel,
        gender,
        patientBirthdate: birthDate,
        patientMaritalStatus: patient_martial_status,
        providerDoctorOrPatientUrl: providerPatientUrl,
      }),
      !!subscriber_patient_id &&
        !!subscriber_national_id &&
        createNphiesDoctorOrPatientData({
          patientOrDoctorId: subscriber_patient_id,
          identifierId: subscriber_national_id,
          identifierIdType: subscriber_national_id_type,
          staffFirstName: subscriber_staff_first_name,
          staffFamilyName: subscriber_staff_family_name,
          staffPhone: subscriber_tel,
          gender: subscriber_gender,
          patientBirthdate: subscriber_birthDate,
          patientMaritalStatus: subscriber_martial_status,
          providerDoctorOrPatientUrl: providerPatientUrl,
        }),
      createNphiesCoverage({
        requestId: request_id,
        coverageType: coverage_type,
        memberId: member_id,
        patientId: patient_id,
        subscriberPatientId: subscriber_patient_id,
        relationship,
        payerOrganization: payer_organization,
        payerBaseUrl: payer_base_url,
        providerOrganizationUrl,
        providerPatientUrl,
        providerCoverageUrl,
        networkName: network_name,
        classes,
        coveragePeriodStart,
        coveragePeriodEnd,
      }),
      hasDoctorsData &&
        doctorsData.map(({ id, license, first_name, family_name }) =>
          createNphiesDoctorOrPatientData({
            patientOrDoctorId: id,
            identifierId: license,
            // identifierIdType: "MD",
            staffFirstName: first_name,
            staffFamilyName: family_name,
            providerDoctorOrPatientUrl: providerDoctorUrl,
            isPatient: false,
          })
        ),
      buildVisionPrescription &&
        createNphiesVisionPrescriptionData({
          visionPrescriptionUrl,
          visionPrescriptionId,
          visionPrescriptionCreatedAt,
          visionLensSpecification,
          requestId: request_id,
          providerDoctorUrl,
          providerPatientUrl,
          doctorId: primaryDoctorId,
          dateWritten: baseData.timestamp,
          patientId: patient_id,
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

export default createNaphiesPreauthRequestFullData;

// const promises = [
  // {
  //   folderName: "preauth/institutional",
  //   data: {
  //     payer_license: "N-I-00001",
  //     provider_license: "N-F-00001",
  //     request_id: "485111",
  //     site_url: "http://sgh.sa.com",
  //     site_tel: "+966515111691",
  //     site_name: "Saudi General Hospital",
  //     provider_organization: "b1b3432921324f97af3be9fd0b1a14ae",
  //     payer_organization: "bff3aa1fbd3648619ac082357bf135db",
  //     payer_name: "Saudi National Insurance",
  //     payer_base_url: "http://sni.com.sa",
  //     coverage_type: "EHCPOL",
  //     patient_id: "151116788",
  //     member_id: "0000000002",
  //     national_id: "0000000002",
  //     national_id_type: undefined,
  //     staff_first_name: "Muhammad",
  //     staff_family_name: "Ali",
  //     gender: "male",
  //     birthDate: "2010-08-21",
  //     patient_martial_status: undefined,
  //     subscriber_patient_id: "3662364643",
  //     subscriber_national_id: "0000000001",
  //     subscriber_national_id_type: undefined,
  //     subscriber_staff_first_name: "Ahmad",
  //     subscriber_staff_family_name: "Khaled",
  //     subscriber_gender: "male",
  //     subscriber_birthDate: "1984-12-25",
  //     subscriber_tel: "+966515111643",
  //     subscriber_martial_status: undefined,
  //     relationship: "child",
  //     classes: [
  //       {
  //         code: "group",
  //         value: "CB135",
  //         name: "Insurance Group A",
  //       },
  //     ],
  //     network_name: "Golden C",
  //     preauthType: "institutional",
  //     supportingInfo: [
  //       {
  //         value: 130,
  //         categoryCode: "vital-sign-systolic",
  //       },
  //       {
  //         value: 85,
  //         categoryCode: "vital-sign-diastolic",
  //       },
  //       {
  //         value: 160,
  //         categoryCode: "vital-sign-height",
  //       },
  //       {
  //         value: 70,
  //         categoryCode: "vital-sign-weight",
  //       },
  //       {
  //         value: "2021-08-30",
  //         categoryCode: "onset",
  //         code: "R07.1",
  //         codeText: "Chest pain on breathing",
  //       },
  //       {
  //         value: ["2021-08-30", "2021-09-05"],
  //         categoryCode: "hospitalized",
  //       },
  //       {
  //         value: 1,
  //         categoryCode: "lab-test",
  //         code: "11421-5",
  //         codeText: "Physical findings of Cardiovascular system",
  //       },
  //     ],
  //     doctorsData: [
  //       {
  //         id: "7",
  //         license: "N-P-00001",
  //         first_name: "Ameera",
  //         family_name: "Hassan",
  //         roleCode: "primary",
  //         practiceCode: "08.26",
  //       },
  //     ],
  //     productsData: [
  //       {
  //         productCode: "38618-00-00",
  //         productCodeType: "procedures",
  //         productName: "Insertion of left and right ventricular assist device",
  //         servicedDate: "2021-08-30",
  //         quantity: 1,
  //         unitPrice: 5000,
  //         extensionTax: 750,
  //         extensionPatientShare: 0,
  //         extensionPackage: "N",
  //       },
  //     ],
  //     diagnosisData: [
  //       {
  //         onAdmission: "Y",
  //         diagCode: "R07.1",
  //         diagType: "principal",
  //       },
  //     ],
  //   },
  // },
  // {
  //   folderName: "preauth/pharmacy",
  //   data: {
  //     payer_license: "N-I-00001",
  //     provider_license: "N-F-00002",
  //     request_id: "488072",
  //     site_url: "http://saudicentralpharmacy.sa.com",
  //     site_tel: "+966512345691",
  //     site_name: "Saudi Central Pharmacy",
  //     provider_organization: "b1b3432921324f97af3be9fd0b1a34fa",
  //     payer_organization: "bff3aa1fbd3648619ac082357bf135db",
  //     payer_name: "Saudi National Insurance",
  //     payer_base_url: "http://sni.com.sa",
  //     coverage_type: "EHCPOL",
  //     patient_id: "123456777",
  //     member_id: "10100000",
  //     national_id: "5555346",
  //     national_id_type: undefined,
  //     staff_first_name: "Zahi",
  //     staff_family_name: "Fathi",
  //     gender: "male",
  //     birthDate: "1988-10-13",
  //     patient_martial_status: undefined,
  //     relationship: "self",
  //     coveragePeriodStart: "2021-08-30",
  //     coveragePeriodEnd: "2021-08-30",
  //     classes: [
  //       {
  //         code: "group",
  //         value: "ABC1234",
  //         name: "Elal Constructions",
  //       },
  //     ],
  //     network_name: "7",
  //     preauthType: "pharmacy",
  //     supportingInfo: [
  //       {
  //         value: 30,
  //         categoryCode: "days-supply",
  //       },
  //       {
  //         value: 10,
  //         categoryCode: "days-supply",
  //       },
  //     ],
  //     doctorsData: undefined,
  //     productsData: [
  //       {
  //         productCode: "06285096001627",
  //         productCodeType: "medication-codes",
  //         productName: "Anti-viral for chest congestion",
  //         servicedDate: "2021-08-30",
  //         quantity: 1,
  //         unitPrice: 60,
  //         extensionTax: 0,
  //         extensionPatientShare: 0,
  //         extensionPackage: "N",
  //       },
  //       {
  //         productCode: "05944736008570",
  //         productCodeType: "medication-codes",
  //         productName: "AMPICILLIN 500MG POWDER FOR IV AND IM INJECTION",
  //         servicedDate: "2021-08-30",
  //         quantity: 1,
  //         unitPrice: 100,
  //         extensionTax: 0,
  //         extensionPatientShare: 0,
  //         extensionPackage: "N",
  //       },
  //     ],
  //     diagnosisData: [
  //       {
  //         diagCode: "R07.1",
  //         diagType: "principal",
  //       },
  //       {
  //         diagCode: "T36.9",
  //         diagType: "secondary",
  //       },
  //     ],
  //   },
  // },
  // {
  //   folderName: "preauth/professional",
  //   data: {
  //     payer_license: "N-I-00001",
  //     provider_license: "N-F-00001",
  //     request_id: "177363",
  //     site_url: "http://sgh.com.sa",
  //     site_tel: "+966512345691",
  //     site_name: "Saudi General Hospital",
  //     provider_organization: "b1b3432921324f97af3be9fd0b1a14ae",
  //     payer_organization: "bff3aa1fbd3648619ac082357bf135db",
  //     payer_name: "Saudi National Insurance",
  //     payer_base_url: "http://sni.com.sa",
  //     coverage_type: "EHCPOL",
  //     patient_id: "123454186",
  //     member_id: "0000000001",
  //     national_id: "0000000001",
  //     national_id_type: undefined,
  //     staff_first_name: "Ahmad",
  //     staff_family_name: "Abbas",
  //     gender: "male",
  //     birthDate: "1984-12-25",
  //     patient_martial_status: undefined,
  //     relationship: "self",
  //     classes: [
  //       {
  //         code: "group",
  //         value: "CB135",
  //         name: "Insurance Group A",
  //       },
  //     ],
  //     network_name: "Golden C",
  //     preauthType: "professional",
  //     supportingInfo: [
  //       {
  //         categoryCode: "reason-for-visit",
  //         code: "new-visit",
  //       },
  //     ],
  //     doctorsData: [
  //       {
  //         id: "7",
  //         license: "N-P-00003",
  //         first_name: "Amar",
  //         family_name: "Moustafa",
  //         roleCode: "primary",
  //         practiceCode: "08.26",
  //       },
  //     ],
  //     productsData: [
  //       {
  //         productCode: "83620-00-10",
  //         productCodeType: "services",
  //         productName: "Physio Therapy",
  //         servicedDate: "2021-10-07",
  //         quantity: 1,
  //         unitPrice: 106,
  //         extensionTax: 15.9,
  //         extensionPatientShare: 0,
  //         extensionPackage: "N",
  //       },
  //     ],
  //     diagnosisData: [
  //       {
  //         diagCode: "S83.1",
  //         diagType: "principal",
  //       },
  //     ],
  //   },
  // },
  // {
  //   folderName: "preauth/dental",
  //   data: {
  //     payer_license: "N-I-00001",
  //     provider_license: "N-F-00003",
  //     request_id: "299051",
  //     site_url: "http://saudidentalclinic.com.sa",
  //     site_tel: "+966512345691",
  //     site_name: "Saudi Dentist Clinic",
  //     provider_organization: "b1b3432921324f97af3be9fd0b1a14ae",
  //     payer_organization: "bff3aa1fbd3648619ac082357bf135db",
  //     payer_name: "Saudi National Insurance",
  //     payer_base_url: "http://sni.com.sa",
  //     coverage_type: "EHCPOL",
  //     patient_id: "3",
  //     member_id: "0000000003",
  //     national_id: "0000000003",
  //     national_id_type: undefined,
  //     staff_first_name: "Sara",
  //     staff_family_name: "Khan",
  //     gender: "female",
  //     birthDate: "1974-03-13",
  //     patient_martial_status: undefined,
  //     subscriber_patient_id: "123454186",
  //     subscriber_national_id: "0000000001",
  //     subscriber_national_id_type: undefined,
  //     subscriber_staff_first_name: "Ahmad",
  //     subscriber_staff_family_name: "Khaled",
  //     subscriber_gender: "male",
  //     subscriber_birthDate: "1984-12-25",
  //     subscriber_tel: "+966512345691",
  //     subscriber_martial_status: undefined,
  //     relationship: "spouse",
  //     classes: [
  //       {
  //         code: "group",
  //         value: "CB135",
  //         name: "Insurance Group A",
  //       },
  //       {
  //         code: "plan",
  //         value: "ABC123",
  //         name: "Insurance Group A",
  //       },
  //     ],
  //     network_name: "Golden C",
  //     preauthType: "oral",
  //     supportingInfo: [
  //       {
  //         categoryCode: "attachment",
  //         value: {
  //           contentType: "image/jpeg",
  //           title: "Sara Khan X-Ray.jpg",
  //           creation: "2021-10-07",
  //           data: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMSE",
  //         },
  //       },
  //     ],
  //     doctorsData: [
  //       {
  //         id: "7",
  //         license: "N-P-00002",
  //         first_name: "Yasser",
  //         family_name: "Mahfooz",
  //         roleCode: "primary",
  //         practiceCode: "22.00",
  //       },
  //     ],
  //     productsData: [
  //       {
  //         productCode: "012",
  //         productCodeType: "oral-health-op",
  //         productName: "Periodic oral examination",
  //         servicedDate: "2021-10-07",
  //         quantity: 1,
  //         unitPrice: 200,
  //         extensionTax: 30,
  //         extensionPatientShare: 40,
  //         extensionPackage: "N",
  //       },
  //       {
  //         productCode: "515",
  //         productCodeType: "oral-health-op",
  //         productName: "Metallic restoration five surfaces direct",
  //         servicedDate: "2021-10-07",
  //         quantity: 1,
  //         unitPrice: 300,
  //         extensionTax: 45,
  //         extensionPatientShare: 60,
  //         extensionPackage: "N",
  //       },
  //       {
  //         productCode: "618",
  //         productCodeType: "oral-health-op",
  //         productName: "Full crown metallic indirect",
  //         servicedDate: "2021-10-07",
  //         quantity: 1,
  //         unitPrice: 1300,
  //         extensionTax: 195,
  //         extensionPatientShare: 100,
  //         extensionPackage: "N",
  //       },
  //     ],
  //     diagnosisData: [
  //       {
  //         diagCode: "K01.1",
  //         diagType: "principal",
  //       },
  //     ],
  //   },
  // },
  // {
  //   folderName: "preauth/visionPrescription",
  //   data: {
  //     payer_license: "N-I-00001",
  //     provider_license: "N-F-00005",
  //     request_id: "129055",
  //     site_url: "http://saudiopticalclinic.com.sa",
  //     site_tel: "+966512345691",
  //     site_name: "Saudi Optical Clinic",
  //     provider_organization: "10",
  //     payer_organization: "11",
  //     payer_name: "Saudi National Insurance",
  //     payer_base_url: "http://sni.com.sa",
  //     coverage_type: "EHCPOL",
  //     patient_id: "3",
  //     member_id: "0000000003",
  //     national_id: "0000000003",
  //     national_id_type: undefined,
  //     staff_first_name: "Sara",
  //     staff_family_name: "Khan",
  //     gender: "female",
  //     birthDate: "1974-03-13",
  //     patient_martial_status: undefined,
  //     subscriber_patient_id: "123454186",
  //     subscriber_national_id: "0000000001",
  //     subscriber_national_id_type: undefined,
  //     subscriber_staff_first_name: "Ahmad",
  //     subscriber_staff_family_name: "Khaled",
  //     subscriber_gender: "male",
  //     subscriber_birthDate: "1984-12-25",
  //     subscriber_tel: "+966512345691",
  //     subscriber_martial_status: undefined,
  //     relationship: "spouse",
  //     classes: [
  //       {
  //         code: "group",
  //         value: "CB135",
  //         name: "Insurance Group A",
  //       },
  //       {
  //         code: "plan",
  //         value: "ABC123",
  //         name: "Insurance Group A",
  //       },
  //     ],
  //     network_name: "Golden C",
  //     preauthType: "vision",
  //     doctorsData: [
  //       {
  //         id: "7",
  //         license: "N-P-00004",
  //         first_name: "Ashraf",
  //         family_name: "Naeem",
  //         roleCode: "primary",
  //         practiceCode: "11.11",
  //       },
  //     ],
  //     productsData: [
  //       {
  //         productCode: "96092-00-10",
  //         productCodeType: "procedures",
  //         // productName: "",
  //         servicedDate: "2021-08-29",
  //         quantity: 1,
  //         unitPrice: 800,
  //         extensionTax: 120,
  //         extensionPatientShare: 0,
  //         extensionPackage: "N",
  //       },
  //     ],
  //     diagnosisData: [
  //       {
  //         diagCode: "Z01.0",
  //         diagType: "principal",
  //       },
  //     ],
  //     visionPrescriptionId: "2199055",
  //     visionPrescriptionCreatedAt: "2021-08-28T14:56:49.034+03:00",
  //     visionLensSpecification: [
  //       {
  //         eye: "left",
  //         sphere: 1.5,
  //         cylinder: 0.75,
  //         axis: 110,
  //         prism: [
  //           {
  //             amount: 2,
  //             base: "up",
  //           },
  //         ],
  //       },
  //       {
  //         eye: "right",
  //         sphere: 2.25,
  //         cylinder: 0.75,
  //         axis: 80,
  //       },
  //     ],
  //   },
  // },
// ].map(({ folderName, data }) =>
//   writeResultFile({
//     folderName,
//     data: createNaphiesPreauthRequestFullData(data),
//   })
// );

// await Promise.all(promises);
