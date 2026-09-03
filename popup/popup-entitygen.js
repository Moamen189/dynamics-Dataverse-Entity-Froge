const entityGenState = {
    attributes: [],
    entityName: null,
    entityId: null,
    origin: null,

    generatedCode: null,
    generatedCodeToRender: null,

    entitySetMappings: {},
    entitySetMappingsLastRefreshed: null,

    format: "cs",
    onlyNonNull: false,
    hasAllFields: false,
    onlyFormFields: true, // Only render the fields which are available by default, otherwise, fetch all.
};

function render() {
    entityGenState.generatedCode = generateCode(false);
    entityGenState.generatedCodeToRender = generateCode(true);

    setCodeOutput(entityGenState.generatedCodeToRender);
    setTitle();

    // Enable action buttons now that we have output
    setActionButtonsEnabled(!!entityGenState.generatedCode);

    // Update format tabs to reflect current selection
    updateFormatTabs(entityGenState.format);

    // Hide loading after render
    hideLoadingOverlay();
}

function generateCode(escape) {
    if (entityGenState.format == "cs") {
        return generateCode_CS(escape);
    }

    if (entityGenState.format == "odatajson") {
        return generateCode_ODataJSON(escape);
    }
}

function setCodeOutput(code) {
    const el = document.getElementById("codeOutput");
    if (!el) return;

    el.innerHTML = code || "";
    delete el.dataset.highlighted;

    // Switch hljs theme based on current data-theme
    const currentTheme =
        document.documentElement.getAttribute("data-theme") || "light";
    switchHljsTheme(currentTheme);

    hljs.highlightAll();
}

function setTitle() {
    if (entityGenState.entityName) {
        const title = entityGenState.entityName.includes("_")
            ? entityGenState.entityName
            : capitalizeFirstLetter(entityGenState.entityName);

        const el = document.getElementById("entityName");
        if (el) el.textContent = title;
    }
}
