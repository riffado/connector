/**
 * Popup entrypoint.
 *
 * Lets the user pair self-hosted Riffado instances. For each added origin
 * we request `host_permissions` at runtime so the bridge content script
 * starts running there. Removing an origin revokes that permission too.
 */

import {
    addPairedOrigin,
    getPairedOrigins,
    removePairedOrigin,
    type StoredOrigin,
} from "./lib/storage";

const HARD_CODED_ORIGINS = ["https://riffado.com"]; // already in manifest host_permissions

function normalize(input: string): string | null {
    try {
        const u = new URL(input);
        if (u.protocol !== "https:" && u.protocol !== "http:") return null;
        // Drop path/query \u2014 we only need origin granularity.
        return `${u.protocol}//${u.host}`;
    } catch {
        return null;
    }
}

async function requestHostPermission(origin: string): Promise<boolean> {
    try {
        return await chrome.permissions.request({ origins: [`${origin}/*`] });
    } catch {
        // Chrome throws if the origin isn't covered by optional_host_permissions.
        return false;
    }
}

async function revokeHostPermission(origin: string): Promise<void> {
    try {
        await chrome.permissions.remove({ origins: [`${origin}/*`] });
    } catch {
        // permission might not be grantable to remove; ignore
    }
}

function render(origins: StoredOrigin[]): void {
    const list = document.getElementById("origins-list") as HTMLUListElement;
    list.innerHTML = "";

    if (origins.length === 0) {
        const li = document.createElement("li");
        li.className = "muted";
        li.textContent = "No self-hosted instances paired.";
        list.appendChild(li);
        return;
    }

    for (const o of origins) {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.className = "origin";
        span.textContent = o.origin;
        li.appendChild(span);

        const btn = document.createElement("button");
        btn.className = "remove";
        btn.type = "button";
        btn.textContent = "Remove";
        btn.addEventListener("click", async () => {
            await revokeHostPermission(o.origin);
            const next = await removePairedOrigin(o.origin);
            render(next);
        });
        li.appendChild(btn);
        list.appendChild(li);
    }
}

async function init(): Promise<void> {
    const openHosted = document.getElementById(
        "open-hosted",
    ) as HTMLButtonElement | null;
    openHosted?.addEventListener("click", () => {
        chrome.tabs.create({ url: "https://riffado.com" }).catch(() => {
            window.open("https://riffado.com", "_blank", "noopener");
        });
    });

    const openWelcome = document.getElementById(
        "open-welcome",
    ) as HTMLAnchorElement | null;
    openWelcome?.addEventListener("click", (e) => {
        e.preventDefault();
        chrome.tabs.create({
            url: chrome.runtime.getURL("src/welcome.html"),
        });
    });

    const form = document.getElementById("add-form") as HTMLFormElement;
    const input = document.getElementById("origin-input") as HTMLInputElement;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const origin = normalize(input.value.trim());
        if (!origin) {
            input.setCustomValidity(
                "Enter a full URL like https://my.example.com",
            );
            input.reportValidity();
            return;
        }
        input.setCustomValidity("");

        if (HARD_CODED_ORIGINS.includes(origin)) {
            // Already covered by the manifest; just persist for visibility.
            const next = await addPairedOrigin(origin);
            render(next);
            input.value = "";
            return;
        }

        const granted = await requestHostPermission(origin);
        if (!granted) {
            input.setCustomValidity(
                "Permission denied. The connector needs access to the Riffado origin to deliver the token.",
            );
            input.reportValidity();
            return;
        }
        const next = await addPairedOrigin(origin);
        render(next);
        input.value = "";
    });

    render(await getPairedOrigins());
}

void init();
