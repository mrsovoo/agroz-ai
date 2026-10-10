import { useEffect, useState } from "react";
import { Network, type ConnectionStatus } from "@capacitor/network";

export interface NetworkState {
  isOnline: boolean;
  connectionType: string;
}

export function useNetwork(): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>(() => {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    return {
      isOnline,
      connectionType: isOnline ? "unknown" : "none",
    };
  });

  useEffect(() => {
    let isSubscribed = true;

    // 1. Initial status fetch via @capacitor/network
    Network.getStatus()
      .then((status: ConnectionStatus) => {
        if (!isSubscribed) return;
        setNetworkState({
          isOnline: status.connected,
          connectionType: status.connectionType || (status.connected ? "unknown" : "none"),
        });
      })
      .catch(() => {
        // Fallback to browser navigator
        if (!isSubscribed) return;
        const online = typeof navigator !== "undefined" ? navigator.onLine : true;
        setNetworkState({
          isOnline: online,
          connectionType: online ? "browser" : "none",
        });
      });

    // 2. Listener via @capacitor/network
    const listenerPromise = Network.addListener("networkStatusChange", (status: ConnectionStatus) => {
      if (!isSubscribed) return;
      setNetworkState({
        isOnline: status.connected,
        connectionType: status.connectionType || (status.connected ? "unknown" : "none"),
      });
    });

    // 3. Native web browser fallback events
    const handleBrowserOnline = () => {
      if (!isSubscribed) return;
      setNetworkState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleBrowserOffline = () => {
      if (!isSubscribed) return;
      setNetworkState({ isOnline: false, connectionType: "none" });
    };

    window.addEventListener("online", handleBrowserOnline);
    window.addEventListener("offline", handleBrowserOffline);

    return () => {
      isSubscribed = false;
      window.removeEventListener("online", handleBrowserOnline);
      window.removeEventListener("offline", handleBrowserOffline);
      listenerPromise.then((handle) => handle.remove()).catch(() => {});
    };
  }, []);

  return networkState;
}
