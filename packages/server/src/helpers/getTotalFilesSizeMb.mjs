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

    console.log("sizes", sizes);

    return sizes.reduce((acc, size) => acc + size, 0);
  }

  return 0;
};

export default getTotalFilesSizeMb;
