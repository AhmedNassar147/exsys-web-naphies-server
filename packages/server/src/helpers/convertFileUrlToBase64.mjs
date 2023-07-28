/*
 *
 * Helper: `convertFileUrlToBase64`.
 *
 */
import axios from "axios";

const convertFileUrlToBase64 = async (fileUrl, removeBaseData) =>
  await new Promise(async (resolve) => {
    try {
      const fileData = await axios.get(fileUrl, {
        responseType: "arraybuffer",
      });

      let fileBase64 = Buffer.from(fileData.data).toString("base64");

      if (removeBaseData && fileBase64) {
        fileBase64 = fileBase64.replace(/.+base64,/, "");
      }

      return resolve(fileBase64);
    } catch (error) {
      const { response } = error || {};
      const { status } = response || {};
      return resolve(!(status === 404));
    }
  });

export default convertFileUrlToBase64;
