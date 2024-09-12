/*
 *
 * Helper: `validateSupportInfoDataBeforeCallingNphies`.
 *
 */
import { createCmdMessage, isArrayHasData } from "@exsys-web-server/helpers";
import isAttachmentCategoryCode from "./isAttachmentCategoryCode.mjs";

const validateSupportInfoDataBeforeCallingNphies =
  (supportInfoKey, shouldValidate) =>
  ({ [supportInfoKey]: supportInfoValues }) => {
    if (shouldValidate && isArrayHasData(supportInfoValues)) {
      const indexOfSomeAttachmentNotFound = supportInfoValues.findIndex(
        ({ categoryCode, value, code }) =>
          isAttachmentCategoryCode(categoryCode, code) &&
          (typeof value === "boolean" || !value)
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
