/*
 *
 * `wasselTokenMiddleware`: `middleware`
 *
 */
import { PACKAGE_JSON_APP_CONFIG, WASSEL_API_NAMES } from "../constants.mjs";
import createWasselRequest from "../helpers/createWasselRequest.mjs";
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from "../nodeHelpers/localStorage.mjs";

const { CREATE_TOKEN } = WASSEL_API_NAMES;

const tokenConfig = {
  fileName: "tokens",
  key: "wassel",
};

const wasselTokenMiddleware = () => async (req, _, next) => {
  const { originalUrl } = req;
  if (/wassel/.test(originalUrl)) {
    const tokenFileData = await getLocalStorageItem(tokenConfig);

    const { expires_in } = tokenFileData || {};

    let shouldCallTokenApi = !expires_in;

    if (expires_in) {
      const expiresInDateTime = new Date(expires_in).getTime();
      const currentDateTime = new Date().getTime();

      shouldCallTokenApi = expiresInDateTime <= currentDateTime;
    }

    if (shouldCallTokenApi) {
      const {
        wassel: { userName, password },
      } = PACKAGE_JSON_APP_CONFIG;

      const { isSuccess, result, error } = await createWasselRequest({
        resourceName: CREATE_TOKEN,
        body: {
          username: userName,
          password: password,
        },
      });

      if (error && !isSuccess) {
        console.error("error", error);
        return next(error);
      }

      await setLocalStorageItem({
        ...tokenConfig,
        value: result,
      });
      return next();
    }
  }
  next();
};

export default wasselTokenMiddleware;
