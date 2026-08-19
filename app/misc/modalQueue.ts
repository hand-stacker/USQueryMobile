import { useEffect } from 'react';
import { create } from 'zustand';

/**
 * Serialises every app-level popup through a single slot.
 *
 * iOS can only present one view controller from a given parent at a time. When
 * two <Modal>s become visible in the same commit, UIKit logs
 * "Attempt to present ... which is already presenting ..." and silently drops
 * the second one — but React still believes it is up, so its full-screen
 * (now invisible) host view sits on top of the app and swallows every touch.
 * The app looks fine and is completely unresponsive.
 *
 * On a fresh install the consent chain, What's New and the welcome prompt all
 * wanted the screen at once, which is exactly how that happened. Everything
 * that can pop up now asks for the slot instead of setting its own `visible`.
 */

// Fade-out of the outgoing modal. The next one is only presented once UIKit has
// finished dismissing the previous, otherwise we recreate the same collision.
const DISMISS_MS = 350;

export const MODAL_PRIORITY = {
  consent: 0,
  welcome: 10,
  whatsNew: 20,
  updateAvailable: 30,
  review: 40,
  upsell: 50,
} as const;

type Entry = { id: string; priority: number };

type ModalQueueState = {
  entries: Entry[];
  active: string | null;
  request: (id: string, priority: number) => void;
  release: (id: string) => void;
};

let promoteTimer: ReturnType<typeof setTimeout> | null = null;
let lastReleaseAt = 0;

export const useModalQueue = create<ModalQueueState>((set, get) => {
  // Always waits out the rest of the dismiss window, so a request arriving
  // while the previous modal is still fading cannot jump the gap.
  const promote = () => {
    if (promoteTimer) clearTimeout(promoteTimer);
    const wait = Math.max(0, lastReleaseAt + DISMISS_MS - Date.now());
    promoteTimer = setTimeout(() => {
      promoteTimer = null;
      const { entries, active } = get();
      if (active || entries.length === 0) return;
      const next = entries.reduce((a, b) => (b.priority < a.priority ? b : a));
      set({ active: next.id });
    }, wait);
  };

  return {
    entries: [],
    active: null,

    request: (id, priority) => {
      const { entries } = get();
      if (entries.some((e) => e.id === id)) return;
      set({ entries: [...entries, { id, priority }] });
      promote();
    },

    release: (id) => {
      const { entries, active } = get();
      if (active !== id && !entries.some((e) => e.id === id)) return;
      if (active === id) lastReleaseAt = Date.now();
      set({
        entries: entries.filter((e) => e.id !== id),
        active: active === id ? null : active,
      });
      promote();
    },
  };
});

/**
 * Returns whether this modal currently owns the screen. Pass `wanted` for
 * "this modal has something to show"; the returned value is what belongs in
 * the <Modal visible={...}> prop.
 *
 * Keep the <Modal> mounted while it is visible — returning null from the
 * component tears the presented host view out mid-dismiss and leaves the same
 * touch-eating orphan behind.
 */
export function useModalSlot(id: string, priority: number, wanted: boolean) {
  const active = useModalQueue((s) => s.active);
  const request = useModalQueue((s) => s.request);
  const release = useModalQueue((s) => s.release);

  useEffect(() => {
    if (wanted) request(id, priority);
    else release(id);
  }, [wanted, id, priority, request, release]);

  useEffect(() => () => release(id), [id, release]);

  return active === id;
}
