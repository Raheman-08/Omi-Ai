import { OmiConnection } from '@omiai/omi-react-native';

let instance: OmiConnection | null = null;

/**
 * Singleton access to OmiConnection. Required because BLE state must be shared
 * across the app and multiple OmiConnection instances can cause conflicts.
 */
export function getOmiConnection(): OmiConnection {
  if (instance == null) {
    instance = new OmiConnection();
  }
  return instance;
}
