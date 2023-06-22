import fetchExsysEligibilityDataAndCallNphies from "../../exsysHelpers/fetchExsysEligibilityDataAndCallNphies.mjs";
import { SERVER_CONFIG } from "../../constants.mjs";

const exsysAPiBodyData = {
  authorization: SERVER_CONFIG.authorization,
  message_event: "eligibility",
  message_event_type: "validation",
  organization_no: SERVER_CONFIG.organizationNo,
  patient_file_no: SERVER_CONFIG.patientFileNo,
  memberid: SERVER_CONFIG.memberId,
  contract_no: SERVER_CONFIG.contractNo,
};

await fetchExsysEligibilityDataAndCallNphies({
  exsysAPiBodyData,
});
