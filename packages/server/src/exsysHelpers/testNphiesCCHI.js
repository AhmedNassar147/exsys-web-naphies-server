import { writeResultFile } from "@exsys-web-server/helpers";
import createNphiesRequest from "../helpers/createNphiesRequest.mjs";

(async () => {
  // https://hsb.nphies.sa/checkinsurance?PatientKey=2005274879&SystemType=1

  const results = await createNphiesRequest({
    baseAPiUrl: "https://hsb.nphies.sa/checkinsurance",
    requestMethod: "GET",
    requestParams: {
      PatientKey: "2005274879",
      SystemType: "1",
    },
  });

  await writeResultFile({
    data: results,
    folderName: "CCHI",
  });
})();
