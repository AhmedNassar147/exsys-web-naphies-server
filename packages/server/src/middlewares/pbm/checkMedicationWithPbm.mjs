/*
 *
 * `checkMedicationWithPbm`: `middleware`
 *
 */
import axios from "axios";
import createBaseExpressMiddleware from "../../helpers/createBaseExpressMiddleware.mjs";

const validatePbmData = async (pbmData) => {
  const { user_name, password, ...otherPbmData } = pbmData;

  // ✅ Node.js Base64 encoding
  const auth = Buffer.from(`${user_name}:${password}`).toString("base64");

  try {
    const response = await axios.post(
      "https://portal.waseel.com/WaseelSwitch/providers/pbm/validate",
      otherPbmData,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      },
    );

    return { result: response.data };
  } catch (error) {
    return {
      error: error.response?.data || error?.message || String(error),
    };
  }
};

export default createBaseExpressMiddleware(
  async (data) => await validatePbmData(data),
);
