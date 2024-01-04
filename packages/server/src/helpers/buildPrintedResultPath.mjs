/*
 *
 * Helper: `buildPrintedResultPath`.
 *
 */
import { isArrayHasData } from "@exsys-web-server/helpers";
import { BASE_RESULT_FOLDER_BATH } from "../constants.mjs";
import buildOrganizationPath from "./buildOrganizationPath.mjs";

const buildPrintedResultPath = ({
  organizationNo,
  clinicalEntityNo,
  innerFolderName,
  segments,
  shouldFilterSegments,
}) => {
  const organizationOrOrganizationUnitPath = buildOrganizationPath(
    organizationNo,
    clinicalEntityNo
  );

  let _segments = isArrayHasData(segments) ? segments : [];

  if (shouldFilterSegments) {
    _segments = _segments.filter(Boolean);
  }

  const folderName = [
    BASE_RESULT_FOLDER_BATH,
    organizationOrOrganizationUnitPath,
    innerFolderName,
    ..._segments,
  ].join("/");

  return folderName;
};

export default buildPrintedResultPath;
