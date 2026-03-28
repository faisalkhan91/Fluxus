const CAREER_START = new Date(2013, 4); // May 2013

export function yearsOfExperience(): number {
  const now = new Date();
  let years = now.getFullYear() - CAREER_START.getFullYear();
  const monthDiff = now.getMonth() - CAREER_START.getMonth();
  if (monthDiff < 0) years--;
  return years;
}
