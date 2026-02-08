import { useState, useCallback, useRef, useEffect } from 'react';
import type { Subscription } from 'react-native-ble-plx';
import { DeviceConnectionState, type OmiDevice, type BleAudioCodec, type OmiConnection } from '@omiai/omi-react-native';
import { getOmiConnection } from '../services/omiConnection';

const SCAN_TIMEOUT_MS = 15000;

/** Shown when BLE native module is missing (e.g. running in Expo Go). */
export const BLE_UNAVAILABLE_MESSAGE =
  'Omi requires a development build. Run: npx expo run:ios or npx expo run:android';

export interface OmiDeviceState {
  devices: OmiDevice[];
  isScanning: boolean;
  connectedDeviceId: string | null;
  connectedDeviceName: string | null;
  connectionState: DeviceConnectionState | null;
  batteryLevel: number | null;
  error: string | null;
  isConnecting: boolean;
  isStreamingAudio: boolean;
  audioCodec: BleAudioCodec | null;
  /** True when BLE native module is not available (e.g. Expo Go). */
  bleUnavailable: boolean;
}

export function useOmiDevice() {
  const [devices, setDevices] = useState<OmiDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<DeviceConnectionState | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isStreamingAudio, setIsStreamingAudio] = useState(false);
  const [audioCodec, setAudioCodec] = useState<BleAudioCodec | null>(null);
  const [bleUnavailable, setBleUnavailable] = useState(false);

  const stopScanRef = useRef<(() => void) | null>(null);
  const audioSubscriptionRef = useRef<Subscription | null>(null);
  const connectionRef = useRef<OmiConnection | null>(null);

  const getConnection = useCallback((): OmiConnection | null => {
    if (connectionRef.current != null) return connectionRef.current;
    try {
      connectionRef.current = getOmiConnection();
      return connectionRef.current;
    } catch {
      setBleUnavailable(true);
      return null;
    }
  }, []);

  const syncConnectionState = useCallback(() => {
    if (connectionRef.current == null) {
      setConnectionState(DeviceConnectionState.DISCONNECTED);
      setConnectedDeviceId(null);
      setConnectedDeviceName(null);
      setBatteryLevel(null);
      return;
    }
    const conn = connectionRef.current;
    if (conn.isConnected()) {
      setConnectionState(DeviceConnectionState.CONNECTED);
      setConnectedDeviceId(conn.connectedDeviceId ?? null);
    } else {
      setConnectionState(DeviceConnectionState.DISCONNECTED);
      setConnectedDeviceId(null);
      setConnectedDeviceName(null);
      setBatteryLevel(null);
    }
  }, []);

  useEffect(() => {
    syncConnectionState();
    return () => {
      stopScanRef.current?.();
    };
  }, [syncConnectionState]);

  const startScan = useCallback(() => {
    setError(null);
    setDevices([]);
    const conn = getConnection();
    if (conn == null) {
      setError(BLE_UNAVAILABLE_MESSAGE);
      return;
    }
    if (conn.isConnected()) return;
    const stopScan = conn.scanForDevices((device) => {
      setDevices((prev) => {
        const exists = prev.some((d) => d.id === device.id);
        if (exists) {
          return prev.map((d) => (d.id === device.id ? { ...d, ...device } : d));
        }
        return [...prev, device];
      });
    }, SCAN_TIMEOUT_MS);
    stopScanRef.current = stopScan;
    setIsScanning(true);
    const t = setTimeout(() => {
      setIsScanning(false);
      stopScanRef.current = null;
    }, SCAN_TIMEOUT_MS);
    return () => {
      clearTimeout(t);
      stopScan();
      setIsScanning(false);
      stopScanRef.current = null;
    };
  }, []);

  const stopScan = useCallback(() => {
    stopScanRef.current?.();
    stopScanRef.current = null;
    setIsScanning(false);
  }, []);

  const connect = useCallback(
    async (deviceId: string, deviceName?: string) => {
      setError(null);
      const conn = getConnection();
      if (conn == null) {
        setError(BLE_UNAVAILABLE_MESSAGE);
        return;
      }
      setIsConnecting(true);
      try {
        const success = await conn.connect(deviceId, (id, state) => {
          setConnectionState(state);
          if (state === DeviceConnectionState.CONNECTED) {
            setConnectedDeviceId(id);
            setConnectedDeviceName(deviceName ?? null);
            setDevices([]);
            stopScanRef.current?.();
            setIsScanning(false);
          } else if (state === DeviceConnectionState.DISCONNECTED) {
            setConnectedDeviceId(null);
            setConnectedDeviceName(null);
            setBatteryLevel(null);
            setAudioCodec(null);
          }
        });
        if (success) {
          const connectedConn = getConnection();
          if (connectedConn == null) return;
          const [level, codec] = await Promise.all([
            connectedConn.getBatteryLevel(),
            connectedConn.getAudioCodec(),
          ]);
          setBatteryLevel(level);
          setAudioCodec(codec);
        } else {
          setError('Connection failed');
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Connection failed';
        setError(message);
      } finally {
        setIsConnecting(false);
      }
    },
    []
  );

  const disconnect = useCallback(async () => {
    setError(null);
    if (connectionRef.current == null) return;
    try {
      if (audioSubscriptionRef.current) {
        await connectionRef.current.stopAudioBytesListener(audioSubscriptionRef.current);
        audioSubscriptionRef.current = null;
        setIsStreamingAudio(false);
      }
      await connectionRef.current.disconnect();
      setConnectedDeviceId(null);
      setConnectedDeviceName(null);
      setConnectionState(DeviceConnectionState.DISCONNECTED);
      setBatteryLevel(null);
      setAudioCodec(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Disconnect failed';
      setError(message);
    }
  }, []);

  const startAudioListener = useCallback(
    async (onAudioBytes?: (bytes: number[]) => void) => {
      const conn = getConnection();
      if (conn == null || !conn.isConnected()) return;
      if (audioSubscriptionRef.current) return;
      try {
        const sub = await conn.startAudioBytesListener((bytes) => {
          onAudioBytes?.(bytes);
        });
        if (sub) {
          audioSubscriptionRef.current = sub;
          setIsStreamingAudio(true);
        }
      } catch {
        setIsStreamingAudio(false);
      }
    },
    []
  );

  const stopAudioListener = useCallback(async () => {
    if (!audioSubscriptionRef.current || connectionRef.current == null) return;
    try {
      await connectionRef.current.stopAudioBytesListener(audioSubscriptionRef.current);
    } finally {
      audioSubscriptionRef.current = null;
      setIsStreamingAudio(false);
    }
  }, []);

  const refreshBattery = useCallback(async () => {
    if (connectionRef.current == null || !connectionRef.current.isConnected()) return;
    try {
      const level = await connectionRef.current.getBatteryLevel();
      setBatteryLevel(level);
    } catch {
      setBatteryLevel(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (connectionState !== DeviceConnectionState.CONNECTED && audioSubscriptionRef.current && connectionRef.current != null) {
      connectionRef.current.stopAudioBytesListener(audioSubscriptionRef.current).catch(() => {});
      audioSubscriptionRef.current = null;
      setIsStreamingAudio(false);
    }
  }, [connectionState]);

  const state: OmiDeviceState = {
    devices,
    isScanning,
    connectedDeviceId,
    connectedDeviceName,
    connectionState,
    batteryLevel,
    error,
    isConnecting,
    isStreamingAudio,
    audioCodec,
    bleUnavailable,
  };

  return {
    ...state,
    startScan,
    stopScan,
    connect,
    disconnect,
    refreshBattery,
    clearError,
    startAudioListener,
    stopAudioListener,
    isConnected: connectionState === DeviceConnectionState.CONNECTED,
  };
}
