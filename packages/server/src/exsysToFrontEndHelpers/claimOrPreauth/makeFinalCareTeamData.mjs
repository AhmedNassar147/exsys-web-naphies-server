/*
 *
 * Helper: `makeFinalCareTeamData`.
 *
 */

import { isArrayHasData } from "@exsys-web-server/helpers";

const makeFinalCareTeamData = (careTeam, careTeamData) => {
  if (!isArrayHasData(careTeam) || !careTeamData) {
    return [];
  }

  return careTeam.map((item) => ({
    ...item,
    ...(careTeamData || null),
  }));
};

export default makeFinalCareTeamData;
