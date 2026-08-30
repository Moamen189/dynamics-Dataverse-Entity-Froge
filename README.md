# 🛠️ Dataverse Entity Forge

![Dataverse Entity Forge Cover](icons/Dataverse%20Entity%20Forge%20Cover.png)

**Dataverse Entity Forge** is a modern, high-productivity developer utility extension for Google Chrome and Microsoft Edge. It is designed to assist Microsoft Power Apps, Dataverse, and Dynamics 365 developers in instantly generating test data representation and entity metadata scripts directly from active record forms.

Whether you are writing C# unit tests using `XrmRealTime` or the standard SDK, or building front-end OData integrations, Dataverse Entity Forge automates the manual translation of form values into C# code or OData-compliant JSON structures.

---

## 🚀 Key Features

- **⚡ Instant Code Generation**: Instantly parses the active entity record form to extract populated field attributes and metadata.
- **💻 C# Entity Representation**: Generates standard SDK-compatible C# `Entity` initialization scripts (e.g. `new Entity("account") { ["name"] = "Acme Corp" }`).
- **🌐 JSON (OData) Output**: Resolves relational lookups and Choice option labels into raw OData-bindable JSON payloads for API requests.
- **💾 Direct File Downloads**: Download generated configurations directly to your system:
  - **C#** saves as `<entity-logical-name>-test-data.cs`
  - **JSON** saves as `<entity-logical-name>-test-data.json`
- **📂 Scope Control**: Toggle between generating code only for fields currently present on the active form layout (**Form fields**), or pull all attributes available on the entity (**All fields**).
- **🚫 Value Filtering**: Exclude empty fields via the **Non-null only** checkbox, or turn it off to generate explicit `null` placeholders.
- **🌓 Adaptive Theme**: Fully supports professional **Light** and **Dark** modes based on system preferences, with choice persistence across browser restarts.
- **🔔 Toast Notifications**: Includes a subtle, built-in toast alert overlay for feedback (e.g., download confirmations, copy successes) that remains clear of key user actions.

---

## 📊 Supported Attribute Types

Dataverse Entity Forge automatically maps complex Microsoft Dataverse field types to their corresponding C# and JSON representation:

| Attribute Type | C# Output Representation | JSON (OData) Output Representation |
|:---|:---|:---|
| **String / Memo** | `@"escaped string"` | `"escaped string"` |
| **Boolean** | `true` / `false` | `true` / `false` |
| **Money** | `new Money(value)` | `value` (numeric) |
| **Decimal / Double** | `value` / `valueM` | `value` (numeric) |
| **DateTime** | `DateTime.Parse("ISO String")` | `"ISO-8601 String"` |
| **Lookup (Relationship)** | `new EntityReference("entity", guid)` | `"fieldname@odata.bind": "/entitysets(guid)"` |
| **OptionSet (Choice)** | `new OptionSetValue(code)` | `code` (numeric) |
| **MultiSelect OptionSet** | `new OptionSetValueCollection(...)` | `[code1, code2, code3]` |
| **File / Image** | Resolves name, GUID, and download URLs | Resolves corresponding record properties |

---

## 🛠️ Step-by-Step Installation

Since Dataverse Entity Forge is a developer utility, it is loaded unpacked:

1. **Download/Clone**: Clone this repository or download the ZIP file and extract it to a directory of your choice.
2. **Open Extensions Page**:
   - In Google Chrome, go to `chrome://extensions/`
   - In Microsoft Edge, go to `edge://extensions/`
3. **Enable Developer Mode**: Turn on the **Developer mode** toggle switch in the top right (or bottom left in older layouts).
4. **Load Extension**: Click the **Load unpacked** button and select the root directory of this repository (the folder containing `manifest.json`).
5. **Pin Extension**: Click the extension puzzle icon in the browser toolbar and pin **Dataverse Entity Forge** to your toolbar for easy access.

---

## 📖 Usage Guide

### 1. Detect Entity Form
Open any Microsoft Dynamics 365 or Dataverse model-driven app record page (e.g. an Account form, Contact record, or custom table form). The page URL parameters must include `pagetype=entityrecord` and a valid record `id`.

### 2. Launch Extension
Click the **Dataverse Entity Forge** icon on the browser toolbar. The extension will automatically establish a secure communication channel with the page worker, verify connection status, and read form metadata.

### 3. Configure Output Parameters
- **Output Format**: Click the **C#** or **JSON** buttons to switch formats.
- **Fields Filter**: Select **Form fields** (only fields rendered on the active form) or **All fields** (queries full client attributes).
- **Data Toggle**: Toggle **Non-null only** to exclude empty values or include them as standard `null` declarations.

### 4. Copy or Download
- Click **Copy** to save the code directly to your clipboard. A green success message will confirm the action.
- Click **C#** or **JSON download buttons** under the code viewer to export the files instantly.

---

## 🏗️ Technical Architecture

The extension uses a secure three-tier message-passing loop designed to respect Dataverse API context isolation:

```
┌────────────────────────────────┐
│         Popup UI Context       │
│  (popup.html, popup-logic.js)   │
│  - Builds code configurations  │
│  - Formats output using HL.js  │
└────────────────┬───────────────┘
                 │
       chrome.tabs.sendMessage
                 │
 ┌───────────────v───────────────┐
 │      Content Script Bridge     │
 │          (content.js)          │
 │  - Runs in extension sandbox  │
 │  - Relays IPC events          │
 └───────────────┬───────────────┘
                 │
          window.postMessage
                 │
 ┌───────────────v───────────────┐
 │     Injected Page Worker       │
 │          (worker.js)           │
 │  - Executes in page context   │
 │  - Direct client-API access   │
 │  - Queries Dataverse metadata │
 └───────────────────────────────┘
```

1. **Injected Page Worker (`worker.js`)**: Executes inside the page DOM to bypass extension origin limits, gaining direct access to the client API framework context (`Xrm.Page`). It collects attribute names, field values, entity names, and queries metadata mappings (via the `/api/data/v9.2/$metadata` OData Web API endpoint).
2. **Content Script Bridge (`content.js`)**: Serves as the communication link. Since injected scripts cannot directly communicate with extension popups, `content.js` listens to page messages and forwards them through standard runtime ports.
3. **Popup Manager (`popup-logic.js` & helpers)**: Computes C# syntax structures or maps OData bind collections based on active user configurations, rendering results with `highlight.js`.

### 💾 Caching and Performance

To avoid hitting the Dataverse Metadata API repeatedly on form loads:
- Entity Set OData Bindings are automatically cached locally using **Chrome Storage (`chrome.storage.local`)**.
- Cache TTL is set to **5 days**. The cache automatically evicts the least recently used (LRU) entity records if storage usage approaches the **5MB** limit.

---

## 💻 Development & Diagnostics

### Debugging the Popup
1. Pin the extension to your toolbar.
2. Right-click the extension icon and select **Inspect Popup**.
3. Use the Console and Network panels to debug popup logic (`popup-logic.js` and rendering).

### Debugging the Injected Worker
1. Open the Developer Tools (F12) on the Dynamics 365 / Dataverse page.
2. In the console, change the context dropdown from `top` to the extension context or inspect the main console for logs generated by `worker.js`.
3. Worker messages contain `EntityGeneratorResponse` inside `event.data`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
