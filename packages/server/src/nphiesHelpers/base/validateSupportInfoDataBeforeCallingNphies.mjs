/*
 *
 * Helper: `validateSupportInfoDataBeforeCallingNphies`.
 *
 */
import { createCmdMessage, isArrayHasData } from "@exsys-web-server/helpers";
import { SUPPORT_INFO_KEY_NAMES } from "../../constants.mjs";

const { attachment } = SUPPORT_INFO_KEY_NAMES;

const validateSupportInfoDataBeforeCallingNphies =
  (supportInfoKey, shouldValidate) =>
  ({ [supportInfoKey]: supportInfoValues }) => {
    if (shouldValidate && isArrayHasData(supportInfoValues)) {
      const indexOfSomeAttachmentNotFound = supportInfoValues.findIndex(
        ({ categoryCode, value }) =>
          categoryCode === attachment && (typeof value === "boolean" || !value)
      );

      const someAttachmentNotFound = indexOfSomeAttachmentNotFound !== -1;

      const validationError = someAttachmentNotFound
        ? `Skipping request because some attachments not found \`Index is\` => ${indexOfSomeAttachmentNotFound}`
        : undefined;

      if (validationError) {
        createCmdMessage({ type: "error", message: validationError });
      }

      return {
        shouldSaveDataToExsys: true,
        validationError,
      };
    }

    return {};
  };

export default validateSupportInfoDataBeforeCallingNphies;
