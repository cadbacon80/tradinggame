import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, ONLINE_ENABLED } from './supabase';
import type { ClientMessage, ServerMessage } from './messages';

/**
 * Thin wrapper over a Supabase Realtime broadcast channel for one room.
 *
 * Usage on the host: openChannel(roomId).onClient(handler).
 * Usage on a peer:   openChannel(roomId).onServer(handler).sendClient(msg).
 *
 * v1 keeps room state in a `rooms` row as well (see supabase/migrations/0001_rooms.sql).
 * Late-join / reconnect: read the row, then subscribe to the channel.
 */
export interface RoomChannel {
  sendServer: (msg: ServerMessage) => Promise<void>;
  sendClient: (msg: ClientMessage) => Promise<void>;
  onServer: (h: (msg: ServerMessage) => void) => void;
  onClient: (h: (msg: ClientMessage) => void) => void;
  close: () => Promise<void>;
}

export function openChannel(roomId: string): RoomChannel {
  if (!ONLINE_ENABLED) {
    throw new Error('Online mode disabled — channel cannot be opened.');
  }
  const client = supabase();
  const channel: RealtimeChannel = client.channel(`room:${roomId}`, {
    config: { broadcast: { self: true, ack: false } },
  });

  let serverHandlers: ((msg: ServerMessage) => void)[] = [];
  let clientHandlers: ((msg: ClientMessage) => void)[] = [];

  channel.on('broadcast', { event: 'server' }, (payload) => {
    for (const h of serverHandlers) h(payload.payload as ServerMessage);
  });
  channel.on('broadcast', { event: 'client' }, (payload) => {
    for (const h of clientHandlers) h(payload.payload as ClientMessage);
  });

  channel.subscribe();

  return {
    sendServer: async (msg) => {
      await channel.send({ type: 'broadcast', event: 'server', payload: msg });
    },
    sendClient: async (msg) => {
      await channel.send({ type: 'broadcast', event: 'client', payload: msg });
    },
    onServer: (h) => {
      serverHandlers.push(h);
    },
    onClient: (h) => {
      clientHandlers.push(h);
    },
    close: async () => {
      serverHandlers = [];
      clientHandlers = [];
      await client.removeChannel(channel);
    },
  };
}

export async function persistRoom(roomId: string, state: object, version: number): Promise<void> {
  if (!ONLINE_ENABLED) return;
  await supabase()
    .from('rooms')
    .upsert({ id: roomId, state, version, updated_at: new Date().toISOString() });
}

export async function loadRoom(roomId: string): Promise<{ state: object; version: number } | null> {
  if (!ONLINE_ENABLED) return null;
  const { data, error } = await supabase()
    .from('rooms')
    .select('state, version')
    .eq('id', roomId)
    .maybeSingle();
  if (error || !data) return null;
  return { state: data.state, version: data.version };
}
