// Puts `deviceName` back onto a page of uploads read from platform's data-set
// endpoint, which does not stamp it. tide-whisperer does, so one upload per
// distinct device model is fetched to learn the name, and the mapping is cached.

import { apiRequestSafe, apiRoutes } from '~/api.server';

/** The subset of an upload this module reads and writes. */
type ResolvableUpload = {
  uploadId?: string;
  deviceId?: string;
  deviceModel?: string;
  deviceName?: string;
  deviceManufacturers?: string[];
  deviceSerialNumber?: string;
};

/**
 * `deviceModel` → friendly name, or `null` for a model tide-whisperer has no
 * name for. Shared across users, since the mapping is a property of the model
 * rather than the account. The `null` entries matter as much as the hits —
 * without them every page view re-probes the same unnameable models.
 */
const deviceNameByModel = new Map<string, string | null>();

/**
 * Probes a single page will issue on a cold cache. Real accounts span a handful
 * of models, so this only bounds a pathological page.
 */
export const maxProbesPerPage = 10;

/**
 * Ask tide-whisperer for one upload from a device and read the name off it.
 *
 * Returns the name, `null` when the response carries no usable one, and
 * `undefined` when the request itself failed — a transient failure must not be
 * cached as a permanent miss.
 */
async function probeDeviceName(
  userId: string,
  deviceId: string,
): Promise<string | null | undefined> {
  const result = await apiRequestSafe<ResolvableUpload[]>(
    apiRoutes.data.getData(userId, { type: 'upload', deviceId, latest: true }),
  );
  if (result.status !== 'success') return undefined;

  const [latest] = Array.isArray(result.data) ? result.data : [];
  const deviceName = latest?.deviceName;
  // tide-whisperer stamps 'Unknown' for models it can't name, which is a miss
  // rather than a label — the same value `getFriendlyDeviceName` skips.
  return deviceName && deviceName !== 'Unknown' ? deviceName : null;
}

/**
 * Fill in `deviceName` on a page of uploads, probing at most one upload per
 * distinct unresolved `deviceModel`.
 *
 * Pure enrichment: rows it cannot resolve come back untouched and fall through
 * to `getFriendlyDeviceName`'s label chain, and a failed probe costs that row's
 * name rather than the page.
 */
export async function resolveDeviceNames<T extends ResolvableUpload>(
  userId: string,
  dataSets: T[],
): Promise<T[]> {
  // model → a deviceId to probe it with. One probe per model, not per device:
  // two devices of the same model resolve to the same name.
  const probeTargets = new Map<string, string>();

  for (const { deviceModel, deviceId } of dataSets) {
    if (!deviceModel || !deviceId) continue;
    if (deviceNameByModel.has(deviceModel)) continue;
    if (probeTargets.has(deviceModel)) continue;
    if (probeTargets.size >= maxProbesPerPage) break;
    probeTargets.set(deviceModel, deviceId);
  }

  await Promise.all(
    [...probeTargets].map(async ([deviceModel, deviceId]) => {
      const probed = await probeDeviceName(userId, deviceId);
      if (probed !== undefined) deviceNameByModel.set(deviceModel, probed);
    }),
  );

  return dataSets.map((dataSet) => {
    if (dataSet.deviceName || !dataSet.deviceModel) return dataSet;
    const deviceName = deviceNameByModel.get(dataSet.deviceModel);
    return deviceName ? { ...dataSet, deviceName } : dataSet;
  });
}

/**
 * Uploads one page load will fetch to backfill pump-settings device info, and
 * how many run at once.
 *
 * Both bounds are load-bearing. Records needing a backfill are one per settings
 * snapshot, not one per device, so a long settings history asks for hundreds of
 * fetches at once — enough to draw 500s from the data service. The enrichment is
 * cosmetic, so rows past the cap keep whatever `name` they arrived with.
 */
export const maxBackfillFetches = 50;
export const backfillBatchSize = 10;

/** The pump-settings fields the backfill reads to decide whether it is needed. */
type BackfillCandidate = {
  uploadId?: string;
  manufacturers?: string[];
  model?: string;
  serialNumber?: string;
};

/**
 * Fetch the uploads that incomplete pump-settings records need, for feeding to
 * `backfillPumpSettingsDeviceInfo`.
 *
 * The paged uploads list can no longer be the source — it would enrich only the
 * records whose upload happens to be on the current page — so each incomplete
 * record's own upload is fetched. tide-whisperer is the source rather than the
 * data-set endpoint because its records arrive with `deviceName` already
 * stamped, which is what the backfill's `name` field wants.
 */
export async function fetchBackfillUploads(
  userId: string,
  pumpSettings: BackfillCandidate[],
): Promise<ResolvableUpload[]> {
  const uploadIds = [
    ...new Set(
      pumpSettings
        .filter(
          (settings) =>
            settings.uploadId &&
            !(
              settings.manufacturers?.length &&
              settings.model &&
              settings.serialNumber
            ),
        )
        .map((settings) => settings.uploadId as string),
    ),
  ].slice(0, maxBackfillFetches);

  const uploads: ResolvableUpload[] = [];
  for (let i = 0; i < uploadIds.length; i += backfillBatchSize) {
    const batch = uploadIds.slice(i, i + backfillBatchSize);
    const results = await Promise.all(
      batch.map((uploadId) =>
        apiRequestSafe<ResolvableUpload[] | { data?: ResolvableUpload[] }>(
          apiRoutes.data.getData(userId, { type: 'upload', uploadId }),
        ),
      ),
    );
    for (const result of results) {
      if (result.status !== 'success') continue;
      const response = result.data;
      uploads.push(
        ...(Array.isArray(response) ? response : (response?.data ?? [])),
      );
    }
  }

  return uploads;
}
