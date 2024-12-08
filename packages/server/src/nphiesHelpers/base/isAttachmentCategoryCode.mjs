/*
 *
 * Helper: `isAttachmentCategoryCode`.
 *
 */
import {
  SUPPORT_INFO_KEY_NAMES,
  USE_NEW_INVESTIGATION_AS_ATTACHMENT,
  INVESTIGATION_RESULT_CODE_FOR_ATTACHMENT,
} from "../../constants.mjs";

const { investigation_result, attachment } = SUPPORT_INFO_KEY_NAMES;

const isAttachmentCategoryCode = (categoryCode, code) => {
  if (categoryCode === attachment) {
    return true;
  }

  return (
    categoryCode === investigation_result &&
    code === INVESTIGATION_RESULT_CODE_FOR_ATTACHMENT &&
    USE_NEW_INVESTIGATION_AS_ATTACHMENT
  );
};

export default isAttachmentCategoryCode;
