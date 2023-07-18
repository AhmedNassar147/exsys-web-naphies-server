/*
 *
 * Helper: `convertSupportInfoAttachmentUrlsToBase64`.
 *
 */

import { isArrayHasData } from "@exsys-web-server/helpers";
import { SUPPORT_INFO_KEY_NAMES } from "../../constants.mjs";
import convertFileUrlToBase64 from "../../helpers/convertFileUrlToBase64.mjs";

const fixContentType = (contentType) =>
  contentType
    ? contentType.includes("image")
      ? contentType.replace(/\/.+/gm, "/jpeg")
      : contentType
    : undefined;

const convertSupportInfoAttachmentUrlsToBase64 = async (supportInfo) => {
  if (isArrayHasData(supportInfo)) {
    return await Promise.all(
      supportInfo.map(async ({ categoryCode, value, contentType, ...item }) => {
        const isAttachment = categoryCode === SUPPORT_INFO_KEY_NAMES.attachment;

        const { value } = item;

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
