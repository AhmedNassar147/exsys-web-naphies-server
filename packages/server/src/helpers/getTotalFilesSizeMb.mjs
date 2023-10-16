/*
 *
 * Helper: `getTotalFilesSizeMb`.
 *
 */

import {
  isArrayHasData,
  getRemoteFilePathData,
} from "@exsys-web-server/helpers";

const getTotalFilesSizeMb = async (files) => {
  if (isArrayHasData(files)) {
    const promises = files.map((fileUrl) => getRemoteFilePathData(fileUrl));
    const sizes = await Promise.all(promises);

    return sizes.reduce((acc, { sizeMb }) => acc + (sizeMb || 0), 0);
  }

  return 0;
};

export default getTotalFilesSizeMb;
