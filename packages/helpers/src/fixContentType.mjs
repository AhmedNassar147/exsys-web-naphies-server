/*
 *
 * Helper: `fixContentType`.
 *
 */
export const NPHIES_SUPPORTED_IMAGE_EXTENSIONS = {
  jpeg: "jpeg",
  jpg: "jpg",
};

const { jpeg } = NPHIES_SUPPORTED_IMAGE_EXTENSIONS;

const fixContentType = (contentType) => {
  if (contentType) {
    const isImage = contentType.includes("image");

    if (isImage) {
      const [fileFirstType, fileType] = contentType.split("/");
      const value = NPHIES_SUPPORTED_IMAGE_EXTENSIONS[fileType];
      return `${fileFirstType}/${value || jpeg}`;
    }

    return contentType;
  }

  return undefined;
};

export default fixContentType;
