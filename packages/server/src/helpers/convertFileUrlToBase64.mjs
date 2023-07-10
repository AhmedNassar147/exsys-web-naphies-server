/*
 *
 * Helper: `convertFileUrlToBase64`.
 *
 */
import axios from "axios";

const convertFileUrlToBase64 = (fileUrl) =>
  new Promise(async (resolve) => {
    const fileData = await axios.get(fileUrl, {
      responseType: "arraybuffer",
    });

    const fileBase64 = Buffer.from(fileData.data).toString("base64");

    return resolve(fileBase64);
  });

export default convertFileUrlToBase64;
