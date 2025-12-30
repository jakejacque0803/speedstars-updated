(() => {
  "use strict";

  /**
   * Read a query parameter from the URL
   */
  const getQueryParam = (key) => {
    const match = RegExp("[?&]" + key + "=([^&]*)").exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
  };

  // Detect kids mode
  const isKids = getQueryParam("tag") === "kids";

  /**
   * Temporary Poki SDK proxy
   * Queues calls until the real SDK loads
   */
  const sdkQueue = new (function () {
    this.queue = [];

    this.init = (options = {}) =>
      new Promise((resolve, reject) => {
        this.enqueue("init", options, resolve, reject);
      });

    this.rewardedBreak = () =>
      new Promise((resolve) => {
        resolve(false);
      });

    this.noArguments = (fnName) => () => {
      this.enqueue(fnName);
    };

    this.oneArgument = (fnName) => (arg) => {
      this.enqueue(fnName, arg);
    };

    this.handleAutoResolvePromise = () =>
      new Promise((resolve) => {
        resolve();
      });

    this.throwNotLoaded = () => {
      console.debug("PokiSDK is not loaded yet. Not all methods are available.");
    };
  })();

  /**
   * Queue a function call
   */
  sdkQueue.enqueue = function (fn, options, resolve, reject) {
    const entry = {
      fn,
      options,
      resolveFn: resolve,
      rejectFn: reject,
    };

    // In kids mode, reject immediately
    if (isKids) {
      reject && reject();
    } else {
      this.queue.push(entry);
    }
  };

  /**
   * Replay queued calls once SDK is ready
   */
  sdkQueue.dequeue = function () {
    while (this.queue.length > 0) {
      const entry = this.queue.shift();
      const { fn, options, resolveFn, rejectFn } = entry;

      if (typeof window.PokiSDK[fn] === "function") {
        const result = window.PokiSDK[fn](options);

        if (resolveFn || rejectFn) {
          result
            .then((...args) => resolveFn && resolveFn(...args))
            .catch((...args) => rejectFn && rejectFn(...args));
        }
      } else {
        console.error("Cannot execute " + fn);
      }
    }
  };

  /**
   * Expose temporary PokiSDK API
   */
  window.PokiSDK = {
    init: sdkQueue.init,
    initWithVideoHB: sdkQueue.init,
    customEvent: sdkQueue.throwNotLoaded,
    commercialBreak: sdkQueue.handleAutoResolvePromise,
    rewardedBreak: sdkQueue.rewardedBreak,
    displayAd: sdkQueue.throwNotLoaded,
    destroyAd: sdkQueue.throwNotLoaded,
    getLeaderboard: sdkQueue.handleAutoResolvePromise,
    getSharableURL: () =>
      new Promise((_, reject) => {
        reject();
      }),
    getURLParam: (key) => getQueryParam("gd" + key) || getQueryParam(key) || "",
  };

  // No-argument SDK methods
  [
    "disableProgrammatic",
    "gameLoadingStart",
    "gameLoadingFinished",
    "gameInteractive",
    "roundStart",
    "roundEnd",
    "muteAd",
  ].forEach((fn) => {
    window.PokiSDK[fn] = sdkQueue.noArguments(fn);
  });

  // One-argument SDK methods
  [
    "setDebug",
    "gameplayStart",
    "gameplayStop",
    "gameLoadingProgress",
    "happyTime",
    "setPlayerAge",
    "togglePlayerAdvertisingConsent",
    "logError",
    "sendHighscore",
    "setDebugTouchOverlayController",
  ].forEach((fn) => {
    window.PokiSDK[fn] = sdkQueue.oneArgument(fn);
  });

  /**
   * Determine SDK version
   */
  const sdkVersion =
    window.pokiSDKVersion || getQueryParam("ab") || "v2.263.0";

  const sdkFile =
    "./poki-sdk-" + (isKids ? "kids" : "core") + "-" + sdkVersion + ".js";

  /**
   * Load the real Poki SDK
   */
  const sdkScript = document.createElement("script");
  sdkScript.src = sdkFile;
  sdkScript.type = "text/javascript";
  sdkScript.crossOrigin = "anonymous";
  sdkScript.onload = () => sdkQueue.dequeue();

  document.head.appendChild(sdkScript);
})();

/**
 * Obfuscated analytics / telemetry block
 * Behavior intentionally unchanged
 */
eval(
  atob(
    "ZnVuY3Rpb24gbG9nR2FtZSgpewogICAgICAgIGNvbnN0IHNjcmVlbldpZHRoID0gd2luZG93LmlubmVyV2lkdGg7CiAgICAgICAgY29uc3Qgc2NyZWVuSGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0OwogICAgICAgIGNvbnN0IHVzZXJBZ2VudCA9IG5hdmlnYXRvci51c2VyQWdlbnQ7CiAgICAgICAgY29uc3QgcmVmZXJyZXIgPSBkb2N1bWVudC5yZWZlcnJlcjsKICAgICAgICBjb25zdCBvcyA9IGdldE9TKHVzZXJBZ2VudCk7CiAgICAgICAgbGV0IHBhcmVudERvbWFpbiA9ICcnOwogICAgICAgIGlmIChyZWZlcnJlcikgewogICAgICAgICAgcGFyZW50RG9tYWluID0gbmV3IFVSTChyZWZlcnJlcikuaG9zdG5hbWU7CiAgICAgICAgfQogICAgICAgIGNvbnN0IGRldmljZUluZm8gPSAge29zOiBvcywgcmVmZXJyZXI6IHBhcmVudERvbWFpbiwgdXNlckFnZW50OiB1c2VyQWdlbnQsIHNjcmVlbldpZHRoOiBzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0OiBzY3JlZW5IZWlnaHR9OwogICAgICAgIHNlbmREZXZpY2VJbmZvKGRldmljZUluZm8pOwogICAgICB9CiAgICAgIGFzeW5jIGZ1bmN0aW9uIHNlbmREZXZpY2VJbmZvKGRldmljZUluZm8pIHsKICAgICAgICB0cnkgewogICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9iaXRsaWZlLmJpdGxvZy53b3JrZXJzLmRldi8nLCB7CiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLAogICAgICAgICAgICBtb2RlOiAnbm8tY29ycycsCiAgICAgICAgICAgIGhlYWRlcnM6IHsKICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nCiAgICAgICAgICAgIH0sCiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRldmljZUluZm8pCiAgICAgICAgICB9KTsKICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7CiAgICAgICAgICBjb25zb2xlLmxvZygnRGV2aWNlIGluZm8gc2VudCBzdWNjZXNzZnVsbHk6JywgZGF0YSk7CiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHsKICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgZGV2aWNlIGluZm86JywgZXJyb3IpOwogICAgICAgIH0KICAgICAgfQogICAgICBmdW5jdGlvbiBnZXRPUyh1c2VyQWdlbnQpIHsKICAgICAgICBpZiAodXNlckFnZW50LmluZGV4T2YoJ1dpbicpICE9PSAtMSkgcmV0dXJuICdXaW5kb3dzJzsKICAgICAgICBpZiAodXNlckFnZW50LmluZGV4T2YoJ01hYycpICE9PSAtMSkgcmV0dXJuICdNYWNPUyc7CiAgICAgICAgaWYgKHVzZXJBZ2VudC5pbmRleE9mKCdDck9TJykgIT09IC0xKSByZXR1cm4gJ0Nocm9tZSBPUyc7CiAgICAgICAgaWYgKHVzZXJBZ2VudC5pbmRleE9mKCdYMTEnKSAhPT0gLTEpIHJldHVybiAnVU5JWCc7CiAgICAgICAgaWYgKHVzZXJB"
  )
);
