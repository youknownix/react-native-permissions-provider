import { type PermissionStatus as NativePermissionStatus } from 'react-native-permissions';

export type PermissionName =
  | 'camera'
  | 'microphone'
  | 'notifications'
  | 'location';

export interface PermissionStatus {
  granted: boolean;
  status: NativePermissionStatus;
}

export type NativePermissionsType = Record<PermissionName, PermissionStatus>;

export interface PermissionsContextValues {
  nativePermissions: NativePermissionsType;
  requestNativePermission?(
    permissionName: PermissionName
  ): Promise<PermissionStatus>;
  checkPermission?: (
    permissionName: PermissionName
  ) => Promise<PermissionStatus>;
}
