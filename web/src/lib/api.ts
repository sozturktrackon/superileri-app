import { deleteUser, fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import { getUrl, remove, uploadData } from 'aws-amplify/storage';
import { client } from './amplify';
import { getLang, LANG_NAMES } from './i18n';
import type { Schema } from './amplify';

export type UserProfile = Schema['UserProfile']['type'];
export type WorkoutLog = Schema['WorkoutLog']['type'];
export type CheckIn = Schema['CheckIn']['type'];

const todayISO = () => new Date().toISOString().slice(0, 10);

/* ----------------------------- Profile ----------------------------------- */

export const getMyProfile = async (): Promise<UserProfile | null> => {
  // Never pass a small `limit` here: with owner auth, AppSync applies `limit`
  // to the table scan BEFORE filtering by owner, so another user's row can
  // fill the page and make YOUR profile query come back empty. Page through
  // until we find our row or run out.
  let nextToken: string | null | undefined;
  do {
    const page = await client.models.UserProfile.list({ nextToken });
    if (page.data.length > 0) return page.data[0];
    nextToken = page.nextToken;
  } while (nextToken);
  return null;
};

export const createProfile = async (input: {
  plan: 'lean' | 'bulk';
  language?: string;
  termsAcceptedAt?: string;
  termsVersion?: string;
  healthConsentAt?: string | null;
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

/* ------------------------- GDPR data rights ------------------------------ */

/** Everything we hold about the user, as a downloadable JSON (portability). */
export const exportMyData = async (): Promise<Record<string, unknown>> => {
  const [profile, workouts, checkIns, partners] = await Promise.all([
    getMyProfile(),
    client.models.WorkoutLog.list({ limit: 1000 }).then((r) => r.data),
    client.models.CheckIn.list({ limit: 500 }).then((r) => r.data),
    client.models.Partner.list({ limit: 100 }).then((r) => r.data),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    profile,
    workouts,
    checkIns: checkIns.map((c) => ({ ...c, photos: checkInPhotos(c) })),
    partners,
    note: 'Photo files can be saved from the Progress screen; paths above identify them.',
  };
};

/** Permanent, full erasure: photos (S3), all rows (DynamoDB), then the
 *  Cognito account itself. Irreversible by design (GDPR Art. 17). */
export const deleteMyAccount = async (): Promise<void> => {
  const [profile, workouts, checkIns, partners, sessions] = await Promise.all([
    getMyProfile(),
    client.models.WorkoutLog.list({ limit: 1000 }).then((r) => r.data),
    client.models.CheckIn.list({ limit: 500 }).then((r) => r.data),
    client.models.Partner.list({ limit: 100 }).then((r) => r.data),
    client.models.LiveSession.list().then((r) => r.data).catch(() => []),
  ]);
  for (const c of checkIns) {
    for (const ph of checkInPhotos(c)) {
      await remove({ path: ph.path }).catch(() => {});
    }
  }
  await Promise.all([
    ...checkIns.map((c) => client.models.CheckIn.delete({ id: c.id })),
    ...workouts.map((w) => client.models.WorkoutLog.delete({ id: w.id })),
    ...partners.map((x) => client.models.Partner.delete({ id: x.id })),
    ...sessions.map((sn) => client.models.LiveSession.delete({ code: sn.code })),
  ].map((pr) => pr.catch(() => {})));
  if (profile) await client.models.UserProfile.delete({ id: profile.id }).catch(() => {});
  await deleteUser(); // removes the Cognito account and ends the session
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
  plan?: 'lean' | 'bulk' | 'lean2' | 'bulk2'
): Promise<UserProfile> => {
  return updateProfile(profileId, { currentDay: day, ...(plan ? { plan } : {}) });
};

/* --------------------------- Check-ins ----------------------------------- */

export type Angle = 'front' | 'back' | 'left' | 'right';
export type AnglePhoto = { angle: Angle; path: string };

export const ANGLES: { id: Angle; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'left', label: 'Left side' },
  { id: 'right', label: 'Right side' },
];

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

/** Upload a set of angle photos in one go. */
export const uploadAnglePhotos = async (
  files: Partial<Record<Angle, File>>
): Promise<AnglePhoto[]> => {
  const entries = Object.entries(files) as [Angle, File | undefined][];
  const results: AnglePhoto[] = [];
  for (const [angle, file] of entries) {
    if (!file) continue;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = await uploadPhoto(file, ext);
    results.push({ angle, path });
  }
  return results;
};

export const photoUrl = async (path: string): Promise<string> => {
  const { url } = await getUrl({ path });
  return url.toString();
};

/** Read a CheckIn's angle photos, falling back to its legacy single photoPath.
 *  The a.json() field round-trips as a JSON string, so parse it defensively
 *  (also tolerates it coming back already-parsed). */
export const checkInPhotos = (checkIn: CheckIn): AnglePhoto[] => {
  let raw: unknown = checkIn.photos;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = null;
    }
  }
  const photos = raw as AnglePhoto[] | null;
  if (Array.isArray(photos) && photos.length) return photos;
  return checkIn.photoPath ? [{ angle: 'front', path: checkIn.photoPath }] : [];
};

/** The photo to show as this check-in's thumbnail (front, else the first). */
export const checkInThumbnail = (checkIn: CheckIn): string | null => {
  const photos = checkInPhotos(checkIn);
  return (photos.find((p) => p.angle === 'front') ?? photos[0])?.path ?? null;
};

export const createCheckIn = async (input: {
  photos: AnglePhoto[];
  kind: 'onboarding' | 'monthly';
  weightKg?: number;
  date?: string; // defaults to today; used by mergeCheckIns to keep the original date
}): Promise<CheckIn> => {
  const front = input.photos.find((p) => p.angle === 'front') ?? input.photos[0];
  // a.json() model fields need a JSON string on write, not a raw array/object.
  const { data, errors } = await client.models.CheckIn.create({
    date: input.date ?? todayISO(),
    analyzed: false,
    kind: input.kind,
    weightKg: input.weightKg,
    photoPath: front?.path,
    photos: JSON.stringify(input.photos),
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join('; '));
  return data!;
};

/** Analyze a check-in with AI across all its angle photos. If the user has an
 *  earlier check-in, its angle photos are sent as the baseline so the AI
 *  reports honest, angle-matched progress vs the first check-in. */
export const analyzeCheckIn = async (checkIn: CheckIn): Promise<CheckIn> => {
  const priors = (await listCheckIns()).filter((c) => c.id !== checkIn.id);
  const baseline = priors.length
    ? priors.reduce((a, b) => (a.date <= b.date ? a : b)) // earliest = first check-in
    : null;

  // Custom mutation a.json() arguments must be sent as JSON strings - unlike
  // model fields, the client does not auto-serialize these.
  const { data, errors } = await client.mutations.analyzeCheckIn({
    photos: JSON.stringify(checkInPhotos(checkIn)),
    baselinePhotos: baseline ? JSON.stringify(checkInPhotos(baseline)) : undefined,
    language: LANG_NAMES[getLang()],
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
  const photos = checkInPhotos(checkIn);
  await Promise.all(
    photos.map((p) => remove({ path: p.path }).catch(() => {}))
  );
  await client.models.CheckIn.delete({ id: checkIn.id });
};

/** Delete only the CheckIn record, leaving its S3 photos untouched. Used by
 *  mergeCheckIns to retire old single-photo rows whose photos now live on the
 *  new merged record. */
const deleteCheckInRecordOnly = async (id: string): Promise<void> => {
  await client.models.CheckIn.delete({ id });
};

/**
 * Combine several older single-photo check-ins (e.g. from before multi-angle
 * capture existed) into one proper angle-tagged check-in. Reuses the existing
 * S3 photos (no re-upload), keeps the earliest date, and deletes the old
 * per-photo records without touching their underlying images.
 */
export const mergeCheckIns = async (
  selections: { checkIn: CheckIn; angle: Angle }[]
): Promise<CheckIn> => {
  if (selections.length < 2) throw new Error('Select at least 2 check-ins to merge.');
  const photos: AnglePhoto[] = selections.map(({ checkIn, angle }) => ({
    angle,
    path: checkInPhotos(checkIn)[0]?.path ?? checkIn.photoPath!,
  }));
  const earliest = selections
    .map((s) => s.checkIn)
    .reduce((a, b) => (a.date <= b.date ? a : b));
  const weightKg = selections.find((s) => s.checkIn.weightKg != null)?.checkIn
    .weightKg;

  const merged = await createCheckIn({
    photos,
    kind: earliest.kind ?? 'monthly',
    weightKg: weightKg ?? undefined,
    date: earliest.date,
  });

  await Promise.all(
    selections.map((s) => deleteCheckInRecordOnly(s.checkIn.id))
  );
  return merged;
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
