const TOAST_DURATION_MS = 2800;
const TOAST_MAX_VISIBLE = 3;

function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    // Enforce max visible
    while (container.children.length >= TOAST_MAX_VISIBLE) {
        container.removeChild(container.firstChild);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "polite");

    const iconMap = {
        success: `<svg class="toast-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 10.8L3.2 8l-.9.9L6 12.6l8-8-.9-.9L6 10.8z" fill="currentColor"/></svg>`,
        error: `<svg class="toast-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.5"/></svg>`,
        info: `<svg class="toast-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 7v4M8 5v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    };

    toast.innerHTML = `${iconMap[type] || iconMap.info}<span class="toast-message">${message}</span>`;

    container.appendChild(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => {
        toast.classList.add("toast-enter");
    });

    setTimeout(() => {
        toast.classList.add("toast-exit");
        toast.addEventListener("animationend", () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }, TOAST_DURATION_MS);
}
