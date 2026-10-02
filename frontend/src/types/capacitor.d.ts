declare module "@capacitor/status-bar" {
  export const StatusBar: {
    setStyle: (options: { style: any }) => Promise<void>;
    setBackgroundColor: (options: { color: string }) => Promise<void>;
  };
  export const Style: {
    Dark: string;
    Light: string;
    Default: string;
  };
}

declare module "@capacitor/splash-screen" {
  export const SplashScreen: {
    hide: (options?: { fadeOutDuration?: number }) => Promise<void>;
    show: (options?: any) => Promise<void>;
  };
}

declare module "@capacitor/push-notifications" {
  export const PushNotifications: {
    checkPermissions: () => Promise<{ receive: string }>;
    requestPermissions: () => Promise<{ receive: string }>;
    register: () => Promise<void>;
    addListener: (eventName: string, listenerFunc: (data: any) => void) => any;
  };
}

declare module "@capacitor/camera" {
  export const Camera: {
    getPhoto: (options: any) => Promise<{ dataUrl?: string }>;
  };
  export const CameraResultType: {
    Uri: string;
    Base64: string;
    DataUrl: string;
  };
  export const CameraSource: {
    Prompt: string;
    Camera: string;
    Photos: string;
  };
}

declare module "@capacitor/geolocation" {
  export const Geolocation: {
    getCurrentPosition: (options?: any) => Promise<{
      coords: {
        latitude: number;
        longitude: number;
        accuracy?: number;
      };
    }>;
  };
}
