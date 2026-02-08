/**
 * Device API – mirrors backend/http/api/device.dart
 */
import { apiCallWithAuthRefresh } from './client';

export interface FirmwareVersionParams {
  deviceModelNumber: string;
  firmwareRevision: string;
  hardwareRevision: string;
  manufacturerName: string;
}

export async function getLatestFirmwareVersion(params: FirmwareVersionParams): Promise<Record<string, unknown>> {
  const q = new URLSearchParams({
    device_model: params.deviceModelNumber,
    firmware_revision: params.firmwareRevision,
    hardware_revision: params.hardwareRevision,
    manufacturer_name: params.manufacturerName,
  }).toString();
  const res = await apiCallWithAuthRefresh<Record<string, unknown>>(`v2/firmware/latest?${q}`, {
    method: 'GET',
  });
  return res.ok && res.data ? res.data : {};
}
