/*
 *
 * Helper: `checkPathExists`.
 *
 */
import { stat } from "fs/promises";

const checkPathExists = async (filePath) =>
  stat(filePath)
    .then(() => filePath)
    .catch(() => false);

export default checkPathExists;
