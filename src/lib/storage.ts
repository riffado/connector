/**
 * Tiny typed wrapper over chrome.storage.local for the only thing we
 * persist: the list of self-hosted OpenPlaud origins the user has paired
 * with this extension. Hosted (`https://openplaud.com`) is always implicit.
 */

const KEY_ORIGINS = "openplaudOrigins";

export interface StoredOrigin {
    origin: string;
    addedAt: number;
}

export async function getPairedOrigins(): Promise<StoredOrigin[]> {
    const data = await chrome.storage.local.get(KEY_ORIGINS);
    const list = data[KEY_ORIGINS];
    return Array.isArray(list) ? (list as StoredOrigin[]) : [];
}

export async function addPairedOrigin(origin: string): Promise<StoredOrigin[]> {
    const normalized = origin.replace(/\/+$/, "");
    const existing = await getPairedOrigins();
    if (existing.some((o) => o.origin === normalized)) return existing;
    const next: StoredOrigin[] = [
        ...existing,
        { origin: normalized, addedAt: Date.now() },
    ];
    await chrome.storage.local.set({ [KEY_ORIGINS]: next });
    return next;
}

export async function removePairedOrigin(
    origin: string,
): Promise<StoredOrigin[]> {
    const existing = await getPairedOrigins();
    const next = existing.filter((o) => o.origin !== origin);
    await chrome.storage.local.set({ [KEY_ORIGINS]: next });
    return next;
}
