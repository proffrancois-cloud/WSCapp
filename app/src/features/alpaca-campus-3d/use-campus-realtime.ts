import { useEffect, useRef } from "react";
import { type CampusRoomChannel } from "./campus-data";
import { useCampusStore } from "./campus-store";
import {
  CAMPUS_MOVEMENT_POLICY,
  CAMPUS_NETWORK_EVENTS,
  CAMPUS_NETWORK_FALLBACK_POLICY,
  CAMPUS_NETWORK_PROTOCOL_VERSION,
  CAMPUS_NETWORK_SCHEMA
} from "./network-contract";

type SupabaseStatus = "connected" | "offline" | "missing-config";

let cachedSupabaseClient: unknown = null;
let cachedSupabaseKey = "";
let movementSeq = 0;

function toNetworkPosition(value: number): number {
  const multiplier = 10 ** CAMPUS_MOVEMENT_POLICY.positionDecimalPlaces;
  return Math.round(value * multiplier) / multiplier;
}

function mapRealtimeStatus(nextStatus: string): string {
  if (nextStatus === "SUBSCRIBED") {
    return "Live room";
  }

  if (nextStatus === "CLOSED") {
    return "Reconnecting";
  }

  if (nextStatus === "CHANNEL_ERROR" || nextStatus === "TIMED_OUT") {
    return CAMPUS_NETWORK_FALLBACK_POLICY.statusLabel;
  }

  return nextStatus;
}

function normalizeSeatPayload(payload: Record<string, unknown>) {
  const action = payload.action === "release" || payload.eventName === CAMPUS_NETWORK_EVENTS.seatReleased
    ? "release"
    : "claim";
  const seatId = String(payload.seatId || "");
  const roomId = String(payload.roomId || "");
  const clientId = String(payload.clientId || payload.occupantClientId || "");

  if (!seatId || !roomId || !clientId) {
    return null;
  }

  return {
    action,
    seatId,
    roomId,
    clientId,
    requestId: String(payload.requestId || `remote-${payload.sentAtMs || Date.now()}`),
    sentAtMs: Number(payload.sentAtMs) || Date.now()
  } as const;
}

function createSupabaseClient(): { client: unknown; status: SupabaseStatus } {
  const config = window.WSC_SUPABASE_CONFIG;
  const createClient = window.supabase?.createClient;

  if (!config?.url || !config.publishableKey) {
    return { client: null, status: "missing-config" };
  }

  if (!createClient) {
    return { client: null, status: "offline" };
  }

  const cacheKey = `${config.url}::${config.publishableKey}`;
  if (cachedSupabaseClient && cachedSupabaseKey === cacheKey) {
    return { client: cachedSupabaseClient, status: "connected" };
  }

  cachedSupabaseClient = createClient(config.url, config.publishableKey);
  cachedSupabaseKey = cacheKey;

  return {
    client: cachedSupabaseClient,
    status: "connected"
  };
}

export function useCampusRealtime(enabled = true): void {
  const campusMode = useCampusStore((state) => state.campusMode);
  const roomId = useCampusStore((state) => state.currentRoomId);
  const localClientId = useCampusStore((state) => state.localPlayer.clientId);
  const localX = useCampusStore((state) => state.localPlayer.x);
  const localY = useCampusStore((state) => state.localPlayer.y);
  const claimedSeatId = useCampusStore((state) => state.claimedSeatId);
  const pendingSeatEvent = useCampusStore((state) => state.pendingSeatEvent);
  const pendingChatMessage = useCampusStore((state) => state.pendingChatMessage);
  const channelRef = useRef<CampusRoomChannel | null>(null);
  const lastSentAtRef = useRef(0);

  useEffect(() => {
    if (!enabled || campusMode !== "multiplayer") {
      channelRef.current = null;
      useCampusStore.getState().setRemotePlayers([]);
      useCampusStore.getState().setRealtimeStatus("Local campus");
      return undefined;
    }

    const realtime = window.WSC_ALPACA_CAMPUS_REALTIME;
    const factory = realtime?.createCampusRoomChannel;

    if (!factory) {
      useCampusStore.getState().setRealtimeStatus(CAMPUS_NETWORK_FALLBACK_POLICY.statusLabel);
      return undefined;
    }

    const { client, status } = createSupabaseClient();
    if (!client || status !== "connected") {
      useCampusStore.getState().setRealtimeStatus(status === "missing-config" ? "Supabase config missing" : CAMPUS_NETWORK_FALLBACK_POLICY.statusLabel);
      return undefined;
    }

    const state = useCampusStore.getState();
    let active = true;
    const channel = factory({
      client,
      roomId,
      localPlayer: {
        ...state.localPlayer,
        roomId
      },
      handlers: {
        onStatus(nextStatus: string) {
          if (!active || channelRef.current !== channel) {
            return;
          }

          useCampusStore.getState().setRealtimeStatus(mapRealtimeStatus(nextStatus));
        },
        onPresenceSync(players: Array<Record<string, unknown>>) {
          if (!active || channelRef.current !== channel) {
            return;
          }

          useCampusStore.getState().setRemotePlayers(players);
        },
        onMove(payload: Record<string, unknown>) {
          if (!active) {
            return;
          }

          useCampusStore.getState().upsertRemotePlayer(payload);
        },
        onAvatar(payload: Record<string, unknown>) {
          if (!active) {
            return;
          }

          useCampusStore.getState().upsertRemotePlayer(payload);
        },
        onChat(payload: Record<string, unknown>) {
          if (!active) {
            return;
          }

          useCampusStore.getState().receiveChatMessage(payload);
        },
        onObject(payload: Record<string, unknown>) {
          if (!active) {
            return;
          }

          const eventName = String(payload.eventName || "");
          if (eventName !== CAMPUS_NETWORK_EVENTS.seatClaimed && eventName !== CAMPUS_NETWORK_EVENTS.seatReleased) {
            return;
          }

          const seatEvent = normalizeSeatPayload(payload);
          if (seatEvent) {
            useCampusStore.getState().syncSeatEvent(seatEvent);
          }
        }
      }
    }) as CampusRoomChannel | null;

    if (!channel) {
      useCampusStore.getState().setRealtimeStatus(CAMPUS_NETWORK_FALLBACK_POLICY.statusLabel);
      return undefined;
    }

    channelRef.current = channel;
    channel.subscribe();

    return () => {
      active = false;
      channelRef.current = null;
      void channel.destroy();
    };
  }, [enabled, campusMode, roomId, localClientId]);

  useEffect(() => {
    const channel = channelRef.current;
    if (!enabled || campusMode !== "multiplayer" || !channel) {
      return;
    }

    const now = window.performance.now();
    if (now - lastSentAtRef.current < CAMPUS_MOVEMENT_POLICY.sendIntervalMs) {
      return;
    }

    lastSentAtRef.current = now;
    const state = useCampusStore.getState();
    const player = state.localPlayer;
    const x = toNetworkPosition(player.x);
    const y = toNetworkPosition(player.y);
    const sentAtMs = Date.now();

    void channel.updatePresence({
      v: CAMPUS_NETWORK_PROTOCOL_VERSION,
      schema: CAMPUS_NETWORK_SCHEMA,
      kind: "presence",
      roomId,
      x,
      y,
      avatar: player.avatar,
      status: state.claimedSeatId ? "sitting" : "online",
      seatId: state.claimedSeatId || undefined,
      interest: {
        mode: "room",
        seatId: state.claimedSeatId || undefined
      },
      updatedAtMs: sentAtMs
    });
    void channel.sendMovement({
      v: CAMPUS_NETWORK_PROTOCOL_VERSION,
      schema: CAMPUS_NETWORK_SCHEMA,
      kind: "move",
      seq: ++movementSeq,
      sentAtMs,
      x,
      y,
      targetX: player.targetX === undefined ? undefined : toNetworkPosition(player.targetX),
      targetY: player.targetY === undefined ? undefined : toNetworkPosition(player.targetY),
      displayName: player.displayName,
      alpacaName: player.alpacaName,
      avatar: player.avatar,
      locomotion: state.claimedSeatId ? "sitting" : "walking",
      seatId: state.claimedSeatId || undefined
    });
  }, [enabled, campusMode, roomId, localX, localY, claimedSeatId]);

  useEffect(() => {
    const channel = channelRef.current;
    if (!enabled || campusMode !== "multiplayer" || !channel || !pendingSeatEvent) {
      return;
    }

    const eventName = pendingSeatEvent.action === "release"
      ? CAMPUS_NETWORK_EVENTS.seatReleased
      : CAMPUS_NETWORK_EVENTS.seatClaimed;

    void channel.updatePresence({
      seatId: pendingSeatEvent.action === "claim" ? pendingSeatEvent.seatId : undefined,
      status: pendingSeatEvent.action === "claim" ? "sitting" : "online",
      updatedAtMs: Date.now()
    });

    const result = channel.sendObject?.({
      ...pendingSeatEvent,
      eventName,
      action: pendingSeatEvent.action,
      occupantClientId: pendingSeatEvent.action === "claim" ? pendingSeatEvent.clientId : undefined
    });

    if (result && "finally" in result) {
      void result.finally(() => {
        useCampusStore.getState().clearPendingSeatEvent(pendingSeatEvent.requestId);
      });
      return;
    }

    useCampusStore.getState().clearPendingSeatEvent(pendingSeatEvent.requestId);
  }, [enabled, campusMode, pendingSeatEvent]);

  useEffect(() => {
    const channel = channelRef.current;
    if (!pendingChatMessage) {
      return;
    }

    if (!enabled || campusMode !== "multiplayer" || !channel?.sendChat) {
      useCampusStore.getState().clearPendingChatMessage(pendingChatMessage.id);
      return;
    }

    const result = channel.sendChat({
      kind: "chat",
      chatId: pendingChatMessage.id,
      message: pendingChatMessage.message,
      displayName: pendingChatMessage.displayName,
      alpacaName: pendingChatMessage.displayName,
      avatar: useCampusStore.getState().localPlayer.avatar
    });

    if (result && "finally" in result) {
      void result.finally(() => {
        useCampusStore.getState().clearPendingChatMessage(pendingChatMessage.id);
      });
      return;
    }

    useCampusStore.getState().clearPendingChatMessage(pendingChatMessage.id);
  }, [enabled, campusMode, pendingChatMessage]);
}
