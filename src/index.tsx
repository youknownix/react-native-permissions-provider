import React, {
  type ReactElement,
  useCallback,
  useEffect,
  useState,
  useContext,
} from 'react';
import { Linking, Platform } from 'react-native';
import {
  check,
  checkNotifications,
  PERMISSIONS,
  request,
  requestNotifications,
  RESULTS,
} from 'react-native-permissions';
import type {
  PermissionName,
  NativePermissionsType,
  PermissionsContextValues,
  PermissionStatus,
} from './types';

const NATIVE_PERMISSION_NAME = {
  camera:
    Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.CAMERA
      : PERMISSIONS.IOS.CAMERA,
  microphone:
    Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.RECORD_AUDIO
      : PERMISSIONS.IOS.MICROPHONE,
};

export const PermissionsContext = React.createContext<PermissionsContextValues>(
  {
    nativePermissions: {
      camera: { granted: false, status: RESULTS.UNAVAILABLE },
      microphone: { granted: false, status: RESULTS.UNAVAILABLE },
      notifications: { granted: false, status: RESULTS.UNAVAILABLE },
      location: { granted: false, status: RESULTS.UNAVAILABLE },
    },
  }
);

export function PermissionsProvider({ children }: { children: ReactElement }) {
  const [nativePermissions, setNativePermissions] =
    useState<NativePermissionsType>({
      camera: { granted: false, status: RESULTS.UNAVAILABLE },
      microphone: { granted: false, status: RESULTS.UNAVAILABLE },
      notifications: { granted: false, status: RESULTS.UNAVAILABLE },
      location: { granted: false, status: RESULTS.UNAVAILABLE },
    });

  const requestNativePermission = useCallback(
    (permissionName: PermissionName) =>
      new Promise<PermissionStatus>(async (resolve) => {
        try {
          let status: PermissionStatus['status'] = RESULTS.UNAVAILABLE;

          switch (permissionName) {
            case 'camera':
              status = await request(NATIVE_PERMISSION_NAME.camera);
              break;
            case 'microphone':
              status = await request(NATIVE_PERMISSION_NAME.microphone);
              break;
            case 'notifications':
              const notificationPermission = await requestNotifications([
                'alert',
                'badge',
                'carPlay',
                'criticalAlert',
                'sound',
              ]);
              status = notificationPermission.status;
              break;
          }

          const permissionStatus: PermissionStatus = {
            granted: status === RESULTS.GRANTED,
            status,
          };

          setNativePermissions((permissions) => ({
            ...permissions,
            [permissionName]: permissionStatus,
          }));

          resolve(permissionStatus);

          if (status === RESULTS.BLOCKED || status === RESULTS.DENIED) {
            Linking.openURL('app-settings:');
          }
        } catch (e) {
          resolve({ granted: false, status: RESULTS.UNAVAILABLE });
        }
      }),
    []
  );

  const checkPermission = useCallback(
    async (permissionName: PermissionName) => {
      let status: PermissionStatus['status'] = RESULTS.UNAVAILABLE;

      switch (permissionName) {
        case 'camera':
          status = await check(NATIVE_PERMISSION_NAME.camera);
          break;
        case 'microphone':
          status = await check(NATIVE_PERMISSION_NAME.microphone);
          break;
        case 'notifications':
          const notificationPermission = await checkNotifications();
          status = notificationPermission.status;
          break;
      }

      const permissionStatus: PermissionStatus = {
        granted: status === RESULTS.GRANTED,
        status,
      };

      setNativePermissions((permissions) => ({
        ...permissions,
        [permissionName]: permissionStatus,
      }));

      return permissionStatus;
    },
    []
  );

  useEffect(() => {
    (async () => {
      const [camPermission, microphonePermission, notificationPermission] =
        await Promise.all([
          check(NATIVE_PERMISSION_NAME.camera),
          check(NATIVE_PERMISSION_NAME.microphone),
          checkNotifications(),
        ]);

      const notificationPermissionStatus = notificationPermission.status;

      setNativePermissions({
        camera: {
          granted: camPermission === RESULTS.GRANTED,
          status: camPermission,
        },
        microphone: {
          granted: microphonePermission === RESULTS.GRANTED,
          status: microphonePermission,
        },
        notifications: {
          granted: notificationPermissionStatus === RESULTS.GRANTED,
          status: notificationPermissionStatus,
        },
        location: {
          granted: false,
          status: RESULTS.DENIED,
        },
      });
    })();
  }, []);

  return (
    <PermissionsContext.Provider
      value={{ nativePermissions, requestNativePermission, checkPermission }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export const usePermissions = () => {
  return useContext(PermissionsContext);
};
