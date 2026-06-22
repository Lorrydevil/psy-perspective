export const LIVE_STREAM_UPDATED_EVENT = "looplot:live-stream-updated";

export type PublishedLiveStream = {
  roomId: string;
  stream: MediaStream;
  isMirrored: boolean;
};

const activeLiveStreams = new Map<string, PublishedLiveStream>();

function dispatchLiveStreamUpdate() {
  window.dispatchEvent(new CustomEvent(LIVE_STREAM_UPDATED_EVENT));
}

export function readPublishedLiveStream(roomId?: string) {
  if (activeLiveStreams.size === 0) {
    return null;
  }

  if (roomId) {
    return activeLiveStreams.get(roomId) ?? null;
  }

  return activeLiveStreams.values().next().value ?? null;
}

export function publishLiveStream(nextStream: PublishedLiveStream) {
  activeLiveStreams.set(nextStream.roomId, nextStream);
  dispatchLiveStreamUpdate();
}

export function clearPublishedLiveStream(roomId?: string) {
  if (activeLiveStreams.size === 0) {
    return;
  }

  if (roomId) {
    if (!activeLiveStreams.has(roomId)) {
      return;
    }

    activeLiveStreams.delete(roomId);
    dispatchLiveStreamUpdate();
    return;
  }

  activeLiveStreams.clear();
  dispatchLiveStreamUpdate();
}
