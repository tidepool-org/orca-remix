// Human-friendly device-name resolution, mirroring @tidepool/viz so ORCA shows
// the same labels (e.g. "ReliOn Platinum", "Tidepool Loop")

export type DeviceNameInput = {
  deviceName?: string;
  deviceManufacturers?: string[];
  deviceModel?: string;
  deviceId?: string;
  dataSetType?: string;
  // Loop/twiist/Trio devices identify via a service id: uploads on client.name,
  // pump-settings on origin.name.
  origin?: { name?: string };
  client?: { name?: string };
};

/**
 * Label app-sourced devices (Tidepool Loop, DIY Loop, twiist, Trio) from their
 * origin/client service id, or null if none matches.
 */
export function getPlatformDeviceLabel(datum: DeviceNameInput): string | null {
  const source = datum.origin?.name || datum.client?.name || '';
  if (!source) return null;
  if (/^org\.tidepool\.[a-zA-Z0-9]*\.?Loop/.test(source))
    return 'Tidepool Loop';
  if (/^com\.[a-zA-Z0-9]*\.?loopkit\.Loop/.test(source)) return 'DIY Loop';
  if (
    /^com\.dekaresearch\.twiist/.test(source) ||
    /^com\.sequelmedtech\.tidepool-service/.test(source)
  ) {
    return 'twiist';
  }
  if (/^org\.nightscout\.Trio/.test(source)) return 'Trio';
  return null;
}

/**
 * Resolve a display name: platform `deviceName` → manufacturer/model label →
 * app-service label → raw `deviceId` → null (callers supply their own fallback).
 */
export function getFriendlyDeviceName(datum: DeviceNameInput): string | null {
  // tide-whisperer stamps deviceName: "Unknown" for models it can't name; skip
  // it so we fall through to a manufacturer/model or deviceId label.
  if (datum.deviceName && datum.deviceName !== 'Unknown') {
    return datum.deviceName;
  }

  const isContinuous = datum.dataSetType === 'continuous';
  const manufacturer = datum.deviceManufacturers?.[0] ?? '';
  const model = datum.deviceModel ?? '';
  let label = '';

  if (manufacturer || model) {
    if (manufacturer === 'Dexcom' && isContinuous) {
      label = 'Dexcom (from Dexcom Account)';
    } else if (manufacturer === 'Abbott' && isContinuous) {
      label = 'FreeStyle Libre (from LibreView)';
    } else if (manufacturer === 'Sequel' && isContinuous) {
      label = 'twiist';
    } else {
      label = [manufacturer, model].filter(Boolean).join(' ');
    }
  } else {
    label = getPlatformDeviceLabel(datum) ?? '';
  }

  if (label && datum.deviceId?.startsWith('tandemCIQ')) {
    label = `${label} (Control-IQ)`;
  }

  if (label) return label;
  if (datum.deviceId) return datum.deviceId;
  return null;
}

type UploadDeviceInfo = {
  uploadId?: string;
  deviceManufacturers?: string[];
  deviceModel?: string;
  deviceSerialNumber?: string;
  deviceName?: string;
};

type PumpSettingsDeviceFields = {
  uploadId?: string;
  manufacturers?: string[];
  model?: string;
  serialNumber?: string;
  name?: string;
};

/**
 * Backfill manufacturer/model/serial/name onto pump-settings records that omit
 * them (some manufacturers write only deviceId/uploadId) from the matching
 * upload. Records already carrying the fields are left untouched.
 */
export function backfillPumpSettingsDeviceInfo<
  T extends PumpSettingsDeviceFields,
>(pumpSettings: T[], uploads: UploadDeviceInfo[]): T[] {
  const uploadsById = new Map<string, UploadDeviceInfo>();
  for (const upload of uploads) {
    if (upload.uploadId) uploadsById.set(upload.uploadId, upload);
  }

  return pumpSettings.map((settings) => {
    const isComplete =
      !!settings.manufacturers?.length &&
      !!settings.model &&
      !!settings.serialNumber;
    if (isComplete || !settings.uploadId) return settings;

    const upload = uploadsById.get(settings.uploadId);
    if (!upload) return settings;

    return {
      ...settings,
      manufacturers: settings.manufacturers?.length
        ? settings.manufacturers
        : upload.deviceManufacturers,
      model: settings.model ?? upload.deviceModel,
      serialNumber: settings.serialNumber ?? upload.deviceSerialNumber,
      // Prefer the upload's curated deviceName, but keep the existing `name`
      // when the upload has none rather than clearing it.
      name: upload.deviceName ?? settings.name,
    };
  });
}
