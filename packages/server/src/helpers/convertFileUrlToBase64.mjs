/*
 *
 * Helper: `convertFileUrlToBase64`.
 *
 */
import axios from "axios";

const convertFileUrlToBase64 = (fileUrl, removeBaseData) =>
  new Promise(async (resolve) => {
    const fileData = await axios.get(fileUrl, {
      responseType: "arraybuffer",
    });

    let fileBase64 = Buffer.from(fileData.data).toString("base64");

    if (removeBaseData && fileBase64) {
      fileBase64 = fileBase64.replace(/.+base64,/, "");
    }

    return resolve(fileBase64);
  });

export default convertFileUrlToBase64;
