import { AdvanceId, advances } from '../src/logic/advances';

const addRequiredTech = (advanceId: AdvanceId, prerequisites: Set<AdvanceId>) => {
  const advance = advances[advanceId];
  if (!advance.prerequisite) {
    return;
  }

  for (const prereq of advance.prerequisite) {
    prerequisites.add(prereq);
    addRequiredTech(prereq, prerequisites);
  }
};

const requiredTech = (advanceId: AdvanceId) => {
  const set = new Set<AdvanceId>();
  addRequiredTech(advanceId, set);
  const arr = Array.from(set);

  console.log(`${advanceId}: ${arr.length}`);
};

const allTech = Object.values(AdvanceId);

for (const tech of allTech) {
  requiredTech(tech);
}
