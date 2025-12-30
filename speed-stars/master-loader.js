"use strict";

/**
 * Master loader for Unity WebGL + Poki SDK
 * Behavior is unchanged — this version is only cleaned and documented.
 */

// Get the current script URL to determine root path
const scripts = document.getElementsByTagName("script");
const currentScriptUrl = scripts[scripts.length - 1].src;
let rootPath = currentScriptUrl.split("master-loader.js")[0];

// Available Unity loaders
const loaders = {
  unity: "unity.js",
  "unity-beta": "./unity-beta.js",
  "unity-2020": "./unity-2020.js"
};

// Special case: force local loaders (used for testing/debugging)
if (window.location.href.includes("pokiForceLocalLoader")) {
  loaders.unity = "/unity.js";
  loaders["unity-beta"] = "/unity-beta/dist/unity-beta.js";
  loaders["unity-2020"] = "/unity-2020/dist/unity-2020.js";
  rootPath = "/loaders";
}

// Ensure config exists
if (!window.config) {
  throw new Error("window.config not found");
}

// Resolve loader from config
const loaderPath = loaders[window.config.loader];
if (!loaderPath) {
  throw new Error(`Loader "${window.config.loader}" not found`);
}

// Set default Unity WebGL loader if not defined
if (!window.config.unityWebglLoaderUrl) {
  const versionParts = window.config.unityVersion
    ? window.config.unityVersion.split(".")
    : [];

  const year = versionParts[0];
  const minor = versionParts[1];

  switch (year) {
    case "2019":
      window.config.unityWebglLoaderUrl =
        minor === "1"
          ? "./UnityLoader.2019.1.js"
          : "./UnityLoader.2019.2.js";
      break;
    default:
      window.config.unityWebglLoaderUrl = "./UnityLoader.js";
  }
}

// Load Poki SDK first
const pokiSdkScript = document.createElement("script");
pokiSdkScript.src = "./poki-sdk.js";

// Once Poki SDK is loaded, load the Unity loader
pokiSdkScript.onload = () => {
  const unityLoaderScript = document.createElement("script");
  unityLoaderScript.src = rootPath + loaderPath;
  document.body.appendChild(unityLoaderScript);
};

// Inject Poki SDK into the page
document.body.appendChild(pokiSdkScript);
