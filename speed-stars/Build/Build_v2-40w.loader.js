/* =========================================================
   Unity WebGL Loader (Polished, Behavior-Preserving)
   Product: Speed Stars
   Version: 2.40
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     Global module state
     --------------------------------------------------------- */

  var Module = {};
  var unityConfig = window.config;
  var downloadProgress = {};

  /* ---------------------------------------------------------
     Utility helpers
     --------------------------------------------------------- */

  function noop() {}

  function logCache(msg) {
    console.log("[UnityCache] " + msg);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /* ---------------------------------------------------------
     System information detection
     --------------------------------------------------------- */

  Module.SystemInfo = (function () {
    var ua = navigator.userAgent;
    var browser = "Unknown browser";
    var version = "Unknown version";

    if (/Chrome/.test(ua)) {
      browser = "Chrome";
      version = ua.match(/Chrome\/([\d.]+)/)?.[1];
    } else if (/Firefox/.test(ua)) {
      browser = "Firefox";
      version = ua.match(/Firefox\/([\d.]+)/)?.[1];
    } else if (/Safari/.test(ua)) {
      browser = "Safari";
      version = ua.match(/Version\/([\d.]+)/)?.[1];
    }

    var canvas = document.createElement("canvas");
    var gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      null;

    return {
      width: screen.width,
      height: screen.height,
      userAgent: ua.trim(),
      browser: browser,
      browserVersion: version,
      mobile: /Mobile|Android|iP(ad|hone)/.test(ua),
      hasWebGL: gl ? 2 : 0,
      hasWasm: typeof WebAssembly === "object",
      hasCursorLock: !!document.body.requestPointerLock,
      hasFullscreen:
        !!document.body.requestFullscreen ||
        !!document.body.webkitRequestFullscreen,
    };
  })();

  /* ---------------------------------------------------------
     Progress aggregation
     --------------------------------------------------------- */

  function updateGlobalProgress() {
    var started = 0;
    var finished = 0;
    var loaded = 0;
    var total = 0;

    for (var key in downloadProgress) {
      var p = downloadProgress[key];
      if (!p.started) return;
      started++;

      if (p.lengthComputable) {
        loaded += p.loaded;
        total += p.total;
      } else if (p.finished) {
        finished++;
      }
    }

    var ratio = 0;
    if (started > 0) {
      ratio = loaded && total
        ? loaded / total
        : finished / started;
    }

    Module.setProgress(clamp(ratio * 0.9, 0, 1));
  }

  function trackProgress(name, evt) {
    var entry = downloadProgress[name] || (downloadProgress[name] = {
      started: false,
      finished: false,
      lengthComputable: false,
      total: 0,
      loaded: 0,
    });

    if (evt && (evt.type === "progress" || evt.type === "load")) {
      if (!entry.started) {
        entry.started = true;
        entry.lengthComputable = evt.lengthComputable;
      }

      entry.total = evt.total;
      entry.loaded = evt.loaded;

      if (evt.type === "load") {
        entry.finished = true;
      }
    }

    updateGlobalProgress();
  }

  /* ---------------------------------------------------------
     Fetch with progress
     --------------------------------------------------------- */

  Module.fetchWithProgress = function (url, options) {
    options = options || {};
    var onProgress = options.onProgress || noop;

    return fetch(url, options).then(function (response) {
      return Module.readBodyWithProgress(
        response,
        onProgress,
        options.enableStreamingDownload
      );
    });
  };

  /* ---------------------------------------------------------
     Startup checks & launch
     --------------------------------------------------------- */

  Module.start = function () {
    if (!Module.SystemInfo.hasWebGL) {
      Module.abort("WebGL not supported.");
      return;
    }

    if (!Module.SystemInfo.hasWasm) {
      Module.abort("WebAssembly not supported.");
      return;
    }

    Module.setProgress(0);
    loadUnity();
  };

  /* ---------------------------------------------------------
     Unity loading
     --------------------------------------------------------- */

  function loadUnity() {
    var script = document.createElement("script");
    script.src = unityConfig.metadata.loader_filename;

    script.onload = function () {
      if (typeof unityFramework === "undefined") {
        Module.abort("Failed to load Unity framework.");
        return;
      }

      unityFramework(Module);
    };

    script.onerror = function () {
      Module.abort("Failed to load Unity loader script.");
    };

    document.body.appendChild(script);
  }

  /* ---------------------------------------------------------
     Error handling
     --------------------------------------------------------- */

  Module.abort = function (message) {
    alert(message);
    throw new Error(message);
  };

  /* ---------------------------------------------------------
     External hooks (used by Unity)
     --------------------------------------------------------- */

  Module.setProgress = function (value) {
    // Unity / Poki hooks read this
  };

  /* ---------------------------------------------------------
     Kickoff
     --------------------------------------------------------- */

  Module.start();
})();
