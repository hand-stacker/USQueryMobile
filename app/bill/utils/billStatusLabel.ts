export type BillStatusColor = 'green' | 'blue' | 'red' | 'gray';

export interface BillStatusInfo {
  label: string;
  color: BillStatusColor;
}

function chamberNames(isHouse: boolean) {
  return isHouse ? { origin: 'House', outer: 'Senate' } : { origin: 'Senate', outer: 'House' };
}

export function getBillStatusInfo(statusCode: number, isHouse: boolean): BillStatusInfo {
  const sc = statusCode ?? -1;
  const { origin, outer } = chamberNames(isHouse);

  if (sc === -1) return { label: 'Pending', color: 'gray' };
  if (sc === 9) return { label: 'Expired', color: 'red' };
  if (sc === 0) return { label: 'Introduced', color: 'green' };

  // Origin chamber (10-29)
  if (sc === 10) return { label: `In ${origin} Committee`, color: 'blue' };
  if (sc === 19) return { label: 'Expired in Committee', color: 'red' };
  if (sc === 20) return { label: `Reported in ${origin} Chamber`, color: 'blue' };
  if (sc === 21) return { label: `Amended - Awaiting ${outer}`, color: 'blue' };
  if (sc === 22) return { label: 'Passed Amended', color: 'green' };
  if (sc === 25) return { label: `Passed ${origin}`, color: 'green' };
  if (sc === 26) return { label: `Failed ${origin}`, color: 'red' };
  if (sc === 27 || sc === 29) return { label: 'Expired After Passage', color: 'red' };
  if (sc === 28) return { label: 'Expired on Floor', color: 'red' };

  // Outer chamber (30-49)
  if (sc === 30) return { label: `In ${outer} Committee`, color: 'blue' };
  if (sc === 39) return { label: 'Expired in Committee', color: 'red' };
  if (sc === 40) return { label: `Reported in ${outer} Chamber`, color: 'blue' };
  if (sc === 41) return { label: `Amended - Awaiting ${origin}`, color: 'blue' };
  if (sc === 42) return { label: 'Passed Amended', color: 'green' };
  if (sc === 45) return { label: `Passed ${outer} Chamber`, color: 'green' };
  if (sc === 46) return { label: `Failed ${outer} Chamber`, color: 'red' };
  if (sc === 47 || sc === 49) return { label: 'Expired After Passage', color: 'red' };
  if (sc === 48) return { label: 'Expired on Floor', color: 'red' };

  // Conference (50-59)
  if (sc === 50) return { label: 'Conference Started', color: 'blue' };
  if (sc === 51) return { label: `Conference Accepted by ${origin}`, color: 'blue' };
  if (sc === 52) return { label: `Conference Accepted by ${outer}`, color: 'blue' };
  if (sc === 53) return { label: 'Conference Report Made', color: 'blue' };
  if (sc === 54) return { label: `${origin} Accepted Report`, color: 'green' };
  if (sc === 55) return { label: `${outer} Accepted Report`, color: 'green' };
  if (sc === 59) return { label: 'Expired in Conference', color: 'red' };

  // Presidential action (60-69)
  if (sc === 60) return { label: 'Enrolled', color: 'blue' };
  if (sc === 61) return { label: 'Became Law', color: 'green' };
  if (sc === 62) return { label: 'Became Law (No Signature)', color: 'green' };
  if (sc === 63) return { label: 'Became Law (Over Veto)', color: 'green' };
  if (sc === 69) return { label: 'Pocket Vetoed', color: 'red' };

  // Veto (70-79)
  if (sc === 70) return { label: 'Vetoed', color: 'red' };
  if (sc === 71) return { label: `Veto Override Passed ${origin}`, color: 'blue' };
  if (sc === 72) return { label: `Veto Override Passed ${outer}`, color: 'blue' };
  if (sc === 75) return { label: 'Veto Overridden', color: 'green' };
  if (sc === 76) return { label: `Veto Override Failed (${origin})`, color: 'red' };
  if (sc === 77) return { label: `Veto Override Failed (${outer})`, color: 'red' };

  return { label: 'Pending', color: 'gray' };
}
