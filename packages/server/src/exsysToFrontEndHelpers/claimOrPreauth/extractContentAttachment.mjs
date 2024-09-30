/*
 *
 * Helper: `extractContentAttachment`.
 *
 */
const extractContentAttachment = (valueAttachment) => {
  let value;
  let title;
  let contentType;
  let creation;

  if (valueAttachment) {
    const {
      contentType: _contentType,
      data,
      title: _title,
      creation: _creation,
    } = valueAttachment;

    value =
      !!data && typeof data === "string"
        ? `data:${_contentType};base64,${data}`
        : undefined;
    contentType = _contentType;
    title = _title;
    creation = _creation;
  }

  return {
    value,
    title,
    contentType,
    creation,
  };
};

export default extractContentAttachment;
