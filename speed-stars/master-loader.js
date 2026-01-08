"use strict";

/**
 * Master Loader for Unity WebGL + Poki SDK
 * Polished for readability, safety, and performance.
 */

// Enable debug logs if needed
const DEBUG = false;
const log = (...args) => DEBUG && console.log("[Loader]", ...args);

// Get current script path
const scripts = document.getElementsByTagName("script");
const currentScript = scripts[scripts.length - 1];
let rootPath = currentScript.src.replace("master-loader.js", "");

// Supported Unity loaders
const loaders = {
  unity: "unity.js",
  "unity-beta": "./unity-beta.js",
  "unity-2020": "./unity-2020.js",
};

// Force local loaders for testing
if (window.location.href.includes("pokiForceLocalLoader")) {
  loaders.unity = "/unity.js";
  loaders["unity-beta"] = "/unity-beta/dist/unity-beta.js";
  loaders["unity-2020"] = "/unity-2020/dist/unity-2020.js";
  rootPath = "/loaders";
  log("Using local loaders");
}

// Ensure config exists
if (!window.config) {
  throw new Error("window.config is missing. Cannot start game.");
}

// Resolve loader
const loaderPath = loaders[window.config.loader];
if (!loaderPath) {
  throw new Error(`Unknown loader type: ${window.config.loader}`);
}

// Set Unity WebGL loader if missing
if (!window.config.unityWebglLoaderUrl) {
  const version = window.config.unityVersion || "";
  const [year, minor] = version.split(".");

  if (year === "2019") {
    window.config.unityWebglLoaderUrl =
      minor === "1" ? "./UnityLoader.2019.1.js" : "./UnityLoader.2019.2.js";
  } else {
    window.config.unityWebglLoaderUrl = "./UnityLoader.js";
  }
}

// Load Poki SDK first
const pokiSdkScript = document.createElement("script");
pokiSdkScript.src = "./poki-sdk.js";
pokiSdkScript.defer = true;

pokiSdkScript.onload = () => {
  log("Poki SDK loaded");

  const unityLoaderScript = document.createElement("script");
  unityLoaderScript.src = rootPath + loaderPath;
  unityLoaderScript.defer = true;

  unityLoaderScript.onload = () => log("Unity loader loaded");
  unityLoaderScript.onerror = () =>
    console.error("Failed to load Unity loader:", unityLoaderScript.src);

  document.body.appendChild(unityLoaderScript);
};

pokiSdkScript.onerror = () =>
  console.error("Failed to load Poki SDK");

document.body.appendChild(pokiSdkScript);
