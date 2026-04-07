function createArtifactHelpers({ fs, path, getWorkspaceRootFsPath, getConfig, getProfile, emitEvent, artifactsRotatedEventName }) {
  function resolveCaptureDir() {
    return path.join(getWorkspaceRootFsPath(), getConfig().captureDir);
  }

  function resolveCapturePath(fileName) {
    return path.join(resolveCaptureDir(), fileName);
  }

  function ensureCaptureDir() {
    const captureDir = resolveCaptureDir();
    fs.mkdirSync(captureDir, { recursive: true });
    return captureDir;
  }

  function resolveArtifactNames(kind) {
    const profile = getProfile(kind);
    return {
      live: `${profile.artifactPrefix}_live.txt`,
      debug: `${profile.artifactPrefix}_debug.jsonl`,
    };
  }

  function makeArtifactRotationTimestamp() {
    return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  }

  function resolveRotatedCapturePath(kind, fileType, timestamp) {
    const currentName = resolveArtifactNames(kind)[fileType];
    const extension = path.extname(currentName);
    const baseName = currentName.slice(0, currentName.length - extension.length);
    return resolveCapturePath(`${baseName}.${timestamp}${extension}`);
  }

  function touchFile(filePath) {
    const handle = fs.openSync(filePath, "a");
    fs.closeSync(handle);
  }

  function rotateArtifactFile(currentPath, rotatedPath) {
    if (!fs.existsSync(currentPath)) return false;
    const stat = fs.statSync(currentPath);
    if (!stat.isFile() || stat.size === 0) return false;
    fs.renameSync(currentPath, rotatedPath);
    return true;
  }

  function listRotatedArtifactPaths(kind, fileType) {
    const currentName = resolveArtifactNames(kind)[fileType];
    const extension = path.extname(currentName);
    const baseName = currentName.slice(0, currentName.length - extension.length);
    return fs
      .readdirSync(resolveCaptureDir(), { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name !== currentName &&
          entry.name.startsWith(`${baseName}.`) &&
          entry.name.endsWith(extension),
      )
      .map((entry) => resolveCapturePath(entry.name));
  }

  function pruneRotatedArtifacts(kind, fileType, maxHistory) {
    if (maxHistory < 0) return;
    const rotatedPaths = listRotatedArtifactPaths(kind, fileType)
      .map((filePath) => ({
        filePath,
        mtimeMs: fs.statSync(filePath).mtimeMs,
      }))
      .sort((left, right) => right.mtimeMs - left.mtimeMs);

    for (const entry of rotatedPaths.slice(maxHistory)) {
      fs.unlinkSync(entry.filePath);
    }
  }

  function touchCurrentArtifacts(kind) {
    ensureCaptureDir();
    const artifacts = resolveArtifactNames(kind);
    touchFile(resolveCapturePath(artifacts.debug));
    touchFile(resolveCapturePath(artifacts.live));
  }

  function shouldRotateArtifacts(reason, config) {
    if (reason === "start") return config.rotateArtifactsOnStart;
    if (reason === "restart") return config.rotateArtifactsOnRestart;
    if (reason === "new-workflow") return config.rotateArtifactsOnNewWorkflow;
    return true;
  }

  function rotateCurrentArtifacts(kind, reason) {
    const config = getConfig();
    if (!shouldRotateArtifacts(reason, config)) {
      touchCurrentArtifacts(kind);
      return { rotatedFiles: [], skipped: true };
    }

    ensureCaptureDir();
    const timestamp = makeArtifactRotationTimestamp();
    const rotatedFiles = [];

    for (const fileType of ["debug", "live"]) {
      const currentPath = resolveCapturePath(resolveArtifactNames(kind)[fileType]);
      const rotatedPath = resolveRotatedCapturePath(kind, fileType, timestamp);
      if (rotateArtifactFile(currentPath, rotatedPath)) {
        rotatedFiles.push(path.basename(rotatedPath));
      }
      pruneRotatedArtifacts(kind, fileType, config.rotationMaxHistory);
    }

    touchCurrentArtifacts(kind);
    emitEvent(artifactsRotatedEventName, {
      kind,
      reason,
      rotatedFiles,
      timestamp,
    });
    return { rotatedFiles, skipped: false, timestamp };
  }

  function appendLiveLog(kind, text) {
    const fileName = resolveArtifactNames(kind).live;
    try {
      ensureCaptureDir();
      fs.appendFileSync(resolveCapturePath(fileName), String(text || ""), "utf8");
    } catch {
      // ignore
    }
  }

  function appendDebugEvent(kind, event) {
    const fileName = resolveArtifactNames(kind).debug;
    try {
      ensureCaptureDir();
      fs.appendFileSync(
        resolveCapturePath(fileName),
        `${JSON.stringify({ ts: new Date().toISOString(), kind, ...event })}\n`,
        "utf8",
      );
    } catch {
      // ignore
    }
  }

  return {
    appendDebugEvent,
    appendLiveLog,
    ensureCaptureDir,
    listRotatedArtifactPaths,
    makeArtifactRotationTimestamp,
    pruneRotatedArtifacts,
    resolveArtifactNames,
    resolveCaptureDir,
    resolveCapturePath,
    resolveRotatedCapturePath,
    rotateArtifactFile,
    rotateCurrentArtifacts,
    shouldRotateArtifacts,
    touchCurrentArtifacts,
    touchFile,
  };
}

module.exports = {
  createArtifactHelpers,
};
