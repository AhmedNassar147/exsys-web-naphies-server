/*
 *
 * Helper: `buildOrganizationPath`.
 *
 */
const buildOrganizationPath = (organizationNo, clinicalEntityNo) => {
  if (!organizationNo) {
    throw new Error("organizationNo wasn't provided to getCertificateData");
  }

  return [organizationNo, clinicalEntityNo].filter(Boolean).join("-");
};

export default buildOrganizationPath;
