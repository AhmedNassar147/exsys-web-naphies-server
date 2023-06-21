import fetchExsysEligibilityDataAndCallNphies from "../../exsysHelpers/fetchExsysEligibilityDataAndCallNphies.mjs";
import { SERVER_CONFIG } from "../../constants.mjs";

const exsysAPiBodyData = {
  authorization: SERVER_CONFIG.authorization,
  message_event: "eligibility",
  message_event_type: "validation",
  organization_no: "001",
  patient_file_no: "115765",
  memberid: "1116201086",
  contract_no: 16529,
};

await fetchExsysEligibilityDataAndCallNphies({
  exsysAPiBodyData,
});
