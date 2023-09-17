/*
 *
 * Helper: `getTotalFilesSizeMb`.
 *
 */

import { isArrayHasData } from "@exsys-web-server/helpers";
import getFilePathSize from "./getFilePathSize.mjs";

const getTotalFilesSizeMb = async (files) => {
  if (isArrayHasData(files)) {
    const promises = files.map((fileUrl) => getFilePathSize(fileUrl));
    const sizes = await Promise.all(promises);

    return sizes.reduce((acc, { sizeMb }) => acc + (sizeMb || 0), 0);
  }

  return 0;
};

export default getTotalFilesSizeMb;
