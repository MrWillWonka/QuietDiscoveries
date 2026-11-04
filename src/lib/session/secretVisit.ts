/**
 * A Secret QD: one a Scene's calendar unlocks quietly, with no Newcomer
 * guarantee, and which never comes up in the tier roll (`roll.ts`). Autumn
 * Harvest's Mr Applewhite, a blue jay standing in for the class's teacher.
 *
 * Once unlocked, each arrival has its own small chance of being him, unless
 * he is already out. The teacher can also ask for him to visit today: he
 * then comes at a random one of the Class's next 2nd to 6th arrivals in
 * that Scene, so it is still a surprise, and the chance roll waits until
 * he has.
 *
 * Pure: the caller keeps the state (one per Class, per Scene, per Secret),
 * says whether a Newcomer has this arrival already, and supplies the random
 * source.
 */

/** The chance of any one arrival being the Secret, once he is about. */
export const SECRET_ODDS = 1 / 60;
/** An asked-for visit lands at least this many arrivals in… */
export const VISIT_FROM = 2;
/** …and at most this many. */
export const VISIT_WITHIN = 6;

export interface VisitState {
  /** The calendar day this state is for, `YYYY-MM-DD`. */
  day: string;
  /** Arrivals in this Scene today, for this Class. */
  arrivals: number;
  /** The teacher has asked for him to visit today. */
  asked: boolean;
  /** The arrival number by which an asked-for visit will have come. */
  slot: number;
  /** He has arrived today, asked for or not. */
  visited: boolean;
}

/** The state for this day: a fresh one once the day has turned. */
export function visitToday(state: VisitState | null, day: string): VisitState {
  return state && state.day === day
    ? state
    : { day, arrivals: 0, asked: false, slot: 0, visited: false };
}

/** The teacher asks for him today: he comes 2 to 6 arrivals from now. */
export function askForVisit(
  state: VisitState | null,
  day: string,
  random: () => number,
): VisitState {
  const today = visitToday(state, day);
  if (today.asked || today.visited) return today;
  const span = VISIT_WITHIN - VISIT_FROM + 1;
  return {
    ...today,
    asked: true,
    slot: today.arrivals + VISIT_FROM + Math.floor(random() * span),
  };
}

/** The teacher changes their mind before he has come. */
export function cancelVisit(state: VisitState | null, day: string): VisitState {
  const today = visitToday(state, day);
  return today.visited ? today : { ...today, asked: false, slot: 0 };
}

/**
 * Whether this arrival is the Secret. Counts the arrival either way.
 *
 * `unlocked` is whether he can arrive at all today; `present` whether he is
 * out already (he never appears twice); `taken` whether a Newcomer is due
 * this arrival, which comes first: an asked-for visit then lands on the
 * next one instead.
 */
export function drawSecret({
  state,
  day,
  unlocked,
  present,
  taken,
  random,
  odds = SECRET_ODDS,
}: {
  state: VisitState | null;
  day: string;
  unlocked: boolean;
  present: boolean;
  taken: boolean;
  random: () => number;
  odds?: number;
}): { arrives: boolean; state: VisitState } {
  const next = { ...visitToday(state, day) };
  next.arrivals += 1;
  if (!unlocked || present || taken) return { arrives: false, state: next };

  const waiting = next.asked && !next.visited;
  const arrives = waiting ? next.arrivals >= next.slot : random() < odds;
  if (arrives) next.visited = true;
  return { arrives, state: next };
}
