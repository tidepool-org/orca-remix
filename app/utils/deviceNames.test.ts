import { describe, it, expect } from 'vitest';
import {
  getFriendlyDeviceName,
  getPlatformDeviceLabel,
  backfillPumpSettingsDeviceInfo,
} from './deviceNames';

describe('deviceNames', () => {
  describe('getFriendlyDeviceName', () => {
    it('returns the platform deviceName when present', () => {
      expect(
        getFriendlyDeviceName({
          deviceName: 'ReliOn Platinum',
          deviceManufacturers: ['Roche'],
          deviceModel: '982',
        }),
      ).toBe('ReliOn Platinum');
    });

    it("skips the literal 'Unknown' deviceName and derives from manufacturer + model", () => {
      expect(
        getFriendlyDeviceName({
          deviceName: 'Unknown',
          deviceManufacturers: ['Roche'],
          deviceModel: '982',
        }),
      ).toBe('Roche 982');
    });

    it('joins manufacturer + model when no deviceName', () => {
      expect(
        getFriendlyDeviceName({
          deviceManufacturers: ['Roche'],
          deviceModel: '982',
        }),
      ).toBe('Roche 982');
    });

    it('labels a continuous Dexcom source from the Dexcom account', () => {
      expect(
        getFriendlyDeviceName({
          deviceManufacturers: ['Dexcom'],
          deviceModel: 'G6',
          dataSetType: 'continuous',
        }),
      ).toBe('Dexcom (from Dexcom Account)');
    });

    it('labels a continuous Abbott source from LibreView', () => {
      expect(
        getFriendlyDeviceName({
          deviceManufacturers: ['Abbott'],
          deviceModel: 'FreeStyle Libre 3',
          dataSetType: 'continuous',
        }),
      ).toBe('FreeStyle Libre (from LibreView)');
    });

    it('labels a continuous Sequel source as twiist', () => {
      expect(
        getFriendlyDeviceName({
          deviceManufacturers: ['Sequel'],
          deviceModel: 'twiist',
          dataSetType: 'continuous',
        }),
      ).toBe('twiist');
    });

    it('appends the Control-IQ suffix for a tandemCIQ deviceId', () => {
      expect(
        getFriendlyDeviceName({
          deviceManufacturers: ['Tandem'],
          deviceModel: 't:slim X2',
          deviceId: 'tandemCIQ1234567890',
        }),
      ).toBe('Tandem t:slim X2 (Control-IQ)');
    });

    it('falls back to deviceId when no name/manufacturer/model', () => {
      expect(
        getFriendlyDeviceName({ deviceId: 'AbbottFreeStyleLibre_ABC' }),
      ).toBe('AbbottFreeStyleLibre_ABC');
    });

    it('returns null for an empty datum', () => {
      expect(getFriendlyDeviceName({})).toBeNull();
    });

    it('labels a Tidepool Loop upload from client.name when no manufacturer/model', () => {
      expect(
        getFriendlyDeviceName({
          dataSetType: 'continuous',
          client: { name: 'org.tidepool.Loop' },
        }),
      ).toBe('Tidepool Loop');
    });

    it('labels a Loop pump-settings record from origin.name', () => {
      expect(
        getFriendlyDeviceName({ origin: { name: 'org.tidepool.Loop' } }),
      ).toBe('Tidepool Loop');
    });
  });

  describe('getPlatformDeviceLabel', () => {
    it('maps known reverse-DNS service ids to their labels', () => {
      expect(
        getPlatformDeviceLabel({ client: { name: 'org.tidepool.Loop' } }),
      ).toBe('Tidepool Loop');
      expect(
        getPlatformDeviceLabel({
          origin: { name: 'com.mycompany.loopkit.Loop' },
        }),
      ).toBe('DIY Loop');
      expect(
        getPlatformDeviceLabel({ client: { name: 'com.dekaresearch.twiist' } }),
      ).toBe('twiist');
      expect(
        getPlatformDeviceLabel({ origin: { name: 'org.nightscout.Trio' } }),
      ).toBe('Trio');
    });

    it('prefers origin.name over client.name', () => {
      expect(
        getPlatformDeviceLabel({
          origin: { name: 'org.nightscout.Trio' },
          client: { name: 'org.tidepool.Loop' },
        }),
      ).toBe('Trio');
    });

    it('returns null for an unknown or absent service', () => {
      expect(
        getPlatformDeviceLabel({ client: { name: 'com.example.unknown' } }),
      ).toBeNull();
      expect(getPlatformDeviceLabel({})).toBeNull();
    });
  });

  describe('backfillPumpSettingsDeviceInfo', () => {
    type PsRow = {
      uploadId?: string;
      manufacturers?: string[];
      model?: string;
      serialNumber?: string;
      name?: string;
    };
    const uploads = [
      {
        uploadId: 'upid_1',
        deviceManufacturers: ['Insulet', 'Abbott'],
        deviceModel: 'OmniPod',
        deviceSerialNumber: '130250652',
        deviceName: 'Insulet Omnipod',
      },
    ];

    it('backfills missing manufacturer/model/serial/name from the matching upload', () => {
      const rows: PsRow[] = [{ uploadId: 'upid_1' }];
      const [result] = backfillPumpSettingsDeviceInfo(rows, uploads);
      expect(result.manufacturers).toEqual(['Insulet', 'Abbott']);
      expect(result.model).toBe('OmniPod');
      expect(result.serialNumber).toBe('130250652');
      expect(result.name).toBe('Insulet Omnipod');
    });

    it('prefers the upload deviceName over a raw pump-settings name', () => {
      const rows: PsRow[] = [
        { uploadId: 'upid_1', name: 'InsulinDeliveryDemo' },
      ];
      const [result] = backfillPumpSettingsDeviceInfo(rows, uploads);
      expect(result.name).toBe('Insulet Omnipod');
    });

    it('clears a raw name when the matching upload has no deviceName', () => {
      const rows: PsRow[] = [
        { uploadId: 'upid_2', name: 'InsulinDeliveryDemo' },
      ];
      const [result] = backfillPumpSettingsDeviceInfo(rows, [
        { uploadId: 'upid_2', deviceManufacturers: ['Tidepool'] },
      ]);
      expect(result.name).toBeUndefined();
    });

    it('leaves records that already carry device info untouched', () => {
      const complete: PsRow = {
        uploadId: 'upid_1',
        manufacturers: ['Tandem'],
        model: '1002717',
        serialNumber: '664049',
      };
      const [result] = backfillPumpSettingsDeviceInfo([complete], uploads);
      expect(result).toBe(complete);
    });

    it('leaves records unchanged when no upload matches', () => {
      const orphan: PsRow = { uploadId: 'upid_missing' };
      const [result] = backfillPumpSettingsDeviceInfo([orphan], uploads);
      expect(result).toBe(orphan);
    });
  });
});
