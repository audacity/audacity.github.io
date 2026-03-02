type UiSemaphoreLock = {
  owner: string;
  priority: number;
};

type UiSemaphoreAcquireOptions = {
  priority?: number;
  preempt?: boolean;
};

type UiSemaphoreListener = (
  channel: string,
  lock: UiSemaphoreLock | null,
) => void;

type UiSemaphore = {
  acquire: (
    channel: string,
    owner: string,
    options?: UiSemaphoreAcquireOptions,
  ) => boolean;
  release: (channel: string, owner: string) => void;
  isLocked: (channel: string) => boolean;
  getLock: (channel: string) => UiSemaphoreLock | null;
  subscribe: (listener: UiSemaphoreListener) => () => void;
};

type UiSemaphoreState = {
  locks: Map<string, UiSemaphoreLock>;
  listeners: Set<UiSemaphoreListener>;
};

declare global {
  interface Window {
    __audacityUiSemaphoreState?: UiSemaphoreState;
    __audacityUiSemaphore?: UiSemaphore;
  }
}

const notify = (state: UiSemaphoreState, channel: string) => {
  const lock = state.locks.get(channel) ?? null;
  state.listeners.forEach((listener) => listener(channel, lock));
};

export const getUiSemaphore = (): UiSemaphore | null => {
  if (typeof window === "undefined") {
    return null;
  }

  if (window.__audacityUiSemaphore) {
    return window.__audacityUiSemaphore;
  }

  const state: UiSemaphoreState = window.__audacityUiSemaphoreState ?? {
    locks: new Map(),
    listeners: new Set(),
  };

  window.__audacityUiSemaphoreState = state;

  const semaphore: UiSemaphore = {
    acquire(channel, owner, options) {
      const requestedPriority = options?.priority ?? 0;
      const shouldPreempt = options?.preempt ?? false;
      const currentLock = state.locks.get(channel);

      if (currentLock && currentLock.owner !== owner) {
        if (!(shouldPreempt && requestedPriority > currentLock.priority)) {
          return false;
        }
      }

      if (
        currentLock &&
        currentLock.owner === owner &&
        currentLock.priority === requestedPriority
      ) {
        return true;
      }

      state.locks.set(channel, {
        owner,
        priority: requestedPriority,
      });
      notify(state, channel);
      return true;
    },
    release(channel, owner) {
      const currentLock = state.locks.get(channel);
      if (currentLock?.owner !== owner) {
        return;
      }

      state.locks.delete(channel);
      notify(state, channel);
    },
    isLocked(channel) {
      return state.locks.has(channel);
    },
    getLock(channel) {
      return state.locks.get(channel) ?? null;
    },
    subscribe(listener) {
      state.listeners.add(listener);
      return () => {
        state.listeners.delete(listener);
      };
    },
  };

  window.__audacityUiSemaphore = semaphore;
  return semaphore;
};
