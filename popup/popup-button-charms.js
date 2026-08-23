function signalStatus(buttonId, status) {
    if (status === "SUCCESS") {
        showToast("Copied to clipboard", "success");
    } else {
        showToast("Failed to copy to clipboard", "error");
    }
}
