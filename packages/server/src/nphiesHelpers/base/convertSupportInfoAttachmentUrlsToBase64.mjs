/*
 *
 * Helper: `convertSupportInfoAttachmentUrlsToBase64`.
 *
 */

import { isArrayHasData } from "@exsys-web-server/helpers";
import { SUPPORT_INFO_KEY_NAMES } from "../../constants.mjs";
import convertFileUrlToBase64 from "../../helpers/convertFileUrlToBase64.mjs";

const { attachment } = SUPPORT_INFO_KEY_NAMES;

const NPHIES_SUPPORTED_IMAGE_EXTENSIONS = ["/jpeg", "/jpg"];

const fixContentType = (contentType) => {
  if (contentType) {
    const isImage = contentType.includes("image");

    if (isImage) {
      contentType = contentType.replace(/\/.+/gm, (value) =>
        NPHIES_SUPPORTED_IMAGE_EXTENSIONS.includes(value)
          ? value
          : NPHIES_SUPPORTED_IMAGE_EXTENSIONS[0]
      );
    }

    return contentType;
  }

  return undefined;
};

const convertSupportInfoAttachmentUrlsToBase64 = async (supportInfo) => {
  if (isArrayHasData(supportInfo)) {
    return await Promise.allSettled(
      supportInfo.map(async ({ categoryCode, value, contentType, ...item }) => {
        const isAttachment = categoryCode === attachment;

        return {
          categoryCode,
          ...item,
          contentType: fixContentType(contentType),
          value: isAttachment
            ? await convertFileUrlToBase64(value, true)
            : value,
        };
      })
    );
  }

  return supportInfo;
};

export default convertSupportInfoAttachmentUrlsToBase64;
