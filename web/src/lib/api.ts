import { fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import { getUrl, remove, uploadData } from 'aws-amplify/storage';
import { client } from './amplify';
import type { Schema } from './amplify';

export type UserProfile = Schema['UserProfile']['type'];
export type WorkoutLog = Schema['WorkoutLog']['type'];
export type CheckIn = Schema['CheckIn']['type'];

const todayISO = () => new Date().toISOString().slice(0, 10);

/* ----------------------------- Profile ----------------------------------- */

export const getMyProfile = async (): Promise<UserProfile | null> => {
  const { data } = await client.models.UserProfile.list({ limit: 1 });
  return data[0] ?? null;
};

export const createProfile = async (input: {
  plan: 'lean' | 'bulk';
  displayName?: string;
  sex?: 'male' | 'female' | 'other';
  birthYear?: number;
  heightCm?: number;
  goal?: string;
}): Promise<UserProfile> => {
  const { data, errors } = await client.models.UserProfile.create({
    ...input,
    startDate: todayISO(),
    currentDay: 1,
    onboardedAt: new Date().toISOString(),
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join('; '));
  return data!;
};

export const updateProfile = async (
  id: string,
  patch: Partial<UserProfile>
): Promise<UserProfile> => {
  const { data, errors } = await client.models.UserProfile.update({
    id,
    ...patch,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join('; '));
  return data!;
};

export const advanceDay = async (profile: UserProfile): Promise<UserProfile> => {
  const next = (profile.currentDay ?? 1) + 1;
  return updateProfile(profile.id, { currentDay: next });
};

/* --------------------------- Workout logs -------------------------------- */

export const logWorkout = async (input: {
  planId: string;
  dayNumber: number;
  groupKeys: string[];
  participants?: string[];
  durationSec?: number;
}): Promise<WorkoutLog> => {
  const { data, errors } = await client.models.WorkoutLog.create({
    date: todayISO(),
    completed: true,
    ...input,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join('; '));
  return data!;
};

export const listWorkouts = async (): Promise<WorkoutLog[]> => {
  const { data } = await client.models.WorkoutLog.list({ limit: 500 });
  return data;
};

/** Manually tick a day done (e.g. trained offline/with a friend). Writes one
 *  log covering all the day's circuits so the calendar shows it complete. */
export const markDayComplete = async (
  planId: string,
  dayNumber: number,
  groupKeys: string[]
): Promise<void> => {
  const { errors } = await client.models.WorkoutLog.create({
    date: todayISO(),
    planId,
    dayNumber,
    groupKeys,
    completed: true,
    notes: 'manual',
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join('; '));
};

/** Undo only a MANUAL mark for a day (never deletes real workout sessions). */
export const clearManualMark = async (
  planId: string,
  dayNumber: number
): Promise<void> => {
  const { data } = await client.models.WorkoutLog.list({ limit: 500 });
  const toDelete = data.filter(
    (l) =>
      l.planId === planId &&
      l.dayNumber === dayNumber &&
      l.notes === 'manual'
  );
  await Promise.all(
    toDelete.map((l) => client.models.WorkoutLog.delete({ id: l.id }))
  );
};

/** Jump to a specific day (and plan); progression continues +1 from there. */
export const setCurrentDay = async (
  profileId: string,
  day: number,
  plan?: 'lean' | 'bulk'
): Promise<UserProfile> => {
  return updateProfile(profileId, { currentDay: day, ...(plan ? { plan } : {}) });
};

/* --------------------------- Check-ins ----------------------------------- */

export const uploadPhoto = async (
  file: Blob,
  ext = 'jpg'
): Promise<string> => {
  const name = `${Date.now()}.${ext}`;
  const result = await uploadData({
    path: ({ identityId }) => `photos/${identityId}/${name}`,
    data: file,
    options: { contentType: file.type || 'image/jpeg' },
  }).result;
  return result.path;
};

export const photoUrl = async (path: string): Promise<string> => {
  const { url } = await getUrl({ path });
  return url.toString();
};

export const createCheckIn = async (input: {
  photoPath: string;
  kind: 'onboarding' | 'monthly';
  weightKg?: number;
}): Promise<CheckIn> => {
  const { data, errors } = await client.models.CheckIn.create({
    date: todayISO(),
    analyzed: false,
    ...input,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join('; '));
  return data!;
};

/** Analyze a check-in with Opus 4.8. If the user has an earlier check-in, its
 *  photo is sent as the baseline so the AI reports honest progress vs the first. */
export const analyzeCheckIn = async (checkIn: CheckIn): Promise<CheckIn> => {
  const priors = (await listCheckIns()).filter((c) => c.id !== checkIn.id);
  const baseline = priors.length
    ? priors.reduce((a, b) => (a.date <= b.date ? a : b)) // earliest = first photo
    : null;

  const { data, errors } = await client.mutations.analyzeCheckIn({
    photoPath: checkIn.photoPath,
    baselinePhotoPath: baseline?.photoPath,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join('; '));

  const { data: updated } = await client.models.CheckIn.update({
    id: checkIn.id,
    aiBodyFatPct: data?.bodyFatPct ?? null,
    aiSummary: data?.summary ?? null,
    aiComparison: data?.comparison ?? null,
    aiRaw: data?.raw ?? null,
    analyzed: true,
  });
  return updated!;
};

export const listCheckIns = async (): Promise<CheckIn[]> => {
  const { data } = await client.models.CheckIn.list({ limit: 200 });
  return data.sort((a, b) => (a.date < b.date ? 1 : -1));
};

export const deleteCheckIn = async (checkIn: CheckIn): Promise<void> => {
  try {
    await remove({ path: checkIn.photoPath });
  } catch {
    /* photo may already be gone */
  }
  await client.models.CheckIn.delete({ id: checkIn.id });
};

/* --------------------------- Videos -------------------------------------- */

const videoUrlCache = new Map<string, string>();

/** Signed URL for an exercise demo video (videos/<exerciseId>.mp4). */
export const exerciseVideoUrl = async (
  exerciseId: string
): Promise<string | null> => {
  if (videoUrlCache.has(exerciseId)) return videoUrlCache.get(exerciseId)!;
  try {
    const { url } = await getUrl({
      path: `videos/${exerciseId}.mp4`,
      options: { validateObjectExistence: true },
    });
    const str = url.toString();
    videoUrlCache.set(exerciseId, str);
    return str;
  } catch {
    return null; // no video uploaded yet
  }
};

/* --------------------------- Partners ------------------------------------ */

export type Partner = Schema['Partner']['type'];

export const listPartners = async (): Promise<Partner[]> => {
  const { data } = await client.models.Partner.list({ limit: 50 });
  return data.sort((a, b) =>
    (a.name || a.email).toLowerCase() < (b.name || b.email).toLowerCase() ? -1 : 1
  );
};

export const addPartner = async (
  email: string,
  name?: string
): Promise<Partner> => {
  const { data, errors } = await client.models.Partner.create({
    email: email.trim().toLowerCase(),
    name: name?.trim() || undefined,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join('; '));
  return data!;
};

export const removePartner = async (id: string): Promise<void> => {
  await client.models.Partner.delete({ id });
};

/** Mark a completed circuit on a linked partner's calendar (cross-account). */
export const logForPartner = async (input: {
  partnerEmail: string;
  planId: string;
  dayNumber: number;
  groupKeys: string[];
  date?: string;
  durationSec?: number;
}): Promise<{ ok: boolean; message: string }> => {
  const { data, errors } = await client.mutations.logForPartner({
    ...input,
    date: input.date ?? todayISO(),
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join('; '));
  return { ok: !!data?.ok, message: data?.message ?? '' };
};

export const getMyEmail = async (): Promise<string> => {
  try {
    const attrs = await fetchUserAttributes();
    return attrs.email ?? '';
  } catch {
    return '';
  }
};

/* --------------------------- Identity ------------------------------------ */

export const getDisplayName = async (): Promise<string> => {
  try {
    const attrs = await fetchUserAttributes();
    return (
      attrs.preferred_username ||
      attrs.given_name ||
      attrs.email?.split('@')[0] ||
      'Athlete'
    );
  } catch {
    const u = await getCurrentUser();
    return u.username;
  }
};
