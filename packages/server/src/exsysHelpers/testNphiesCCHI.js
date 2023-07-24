import { writeResultFile } from "@exsys-web-server/helpers";
import createNphiesRequest from "../helpers/createNphiesRequest.mjs";

(async () => {
  // http://hsb.oba.nphies.sa/check-insurance?PatientKey=2005274879&SystemType=1

  const results = await createNphiesRequest({
    baseAPiUrl: "http://hsb.oba.nphies.sa/check-insurance",
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
