function createPtySessionHelpers({
  ERROR_CODES,
  delay,
  emitEvent,
  getConfig,
  getProfile,
  getSession,
  hasMeaningfulProgressOutput,
  makeError,
  normalizeOutputText,
  stripAnsi,
  toSemanticText,
}) {
  function refreshSessionLimits(session) {
    session.maxRetryCount = getConfig().maxRetryCount;
  }

  function clearLastError(session) {
    session.lastErrorCode = null;
    session.lastErrorSummary = null;
    session.lastFailedCommand = null;
  }

  function setLastError(session, code, summary, command) {
    session.lastErrorCode = code;
    session.lastErrorSummary = summary;
    session.lastFailedCommand = command || null;
  }

  function setRecoveryState(session, nextState, reason, extra = {}) {
    if (session.recoveryState === nextState) return;
    const previousState = session.recoveryState;
    session.recoveryState = nextState;
    emitEvent("pty.state.changed", {
      kind: session.kind,
      sessionId: session.sessionId,
      from: previousState,
      to: nextState,
      reason,
      ...extra,
    });
  }

  function removeOutputWaiter(session, waiterId) {
    const waiter = session.outputWaiters.get(waiterId);
    if (!waiter) return;
    session.outputWaiters.delete(waiterId);
    if (waiter.timer) clearTimeout(waiter.timer);
  }

  function rejectAllOutputWaiters(session, error) {
    const waiters = Array.from(session.outputWaiters.values());
    session.outputWaiters.clear();
    for (const waiter of waiters) {
      if (waiter.timer) clearTimeout(waiter.timer);
      waiter.reject(error);
    }
  }

  function resolveOutputWaiters(session, text) {
    const normalizedChunk = normalizeOutputText(text);
    if (!normalizedChunk) return;

    for (const waiter of session.outputWaiters.values()) {
      waiter.buffer = `${waiter.buffer}${normalizedChunk}`.slice(-20000);
      if (hasMeaningfulProgressOutput(normalizedChunk)) {
        waiter.lastProgressAt = Date.now();
      }
      if (waiter.buffer.includes(waiter.expected)) {
        removeOutputWaiter(session, waiter.id);
        waiter.resolve({ ok: true, expected: waiter.expectedRaw, sessionId: session.sessionId });
      }
    }
  }

  function waitForOutputMatch(kind, options) {
    const session = getSession(kind);
    const expectedRaw = String(options.expected || "");
    const expected = normalizeOutputText(expectedRaw).trim();
    const timeoutMs = Math.max(1000, Number(options.timeoutMs) || getConfig().verifyTimeoutMs);
    const maxTimeoutMs = Math.max(timeoutMs, Number(options.maxTimeoutMs) || getConfig().verifyMaxTimeoutMs);
    const waiterId = `${session.kind}-waiter-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
      const waiter = {
        id: waiterId,
        expected,
        expectedRaw,
        buffer: normalizeOutputText(session.recentOutput),
        lastProgressAt: startedAt,
        resolve,
        reject,
        timer: null,
      };

      const tick = () => {
        if (!session.outputWaiters.has(waiterId)) return;
        const now = Date.now();
        if (waiter.buffer.includes(expected)) {
          removeOutputWaiter(session, waiterId);
          resolve({ ok: true, expected: expectedRaw, sessionId: session.sessionId });
          return;
        }
        if (now - startedAt >= maxTimeoutMs) {
          removeOutputWaiter(session, waiterId);
          reject(makeError(ERROR_CODES.PTY_VERIFY_TIMEOUT, `${options.label || "wait"} exceeded max timeout.`));
          return;
        }
        if (now - waiter.lastProgressAt >= timeoutMs) {
          removeOutputWaiter(session, waiterId);
          reject(makeError(ERROR_CODES.PTY_VERIFY_TIMEOUT, `${options.label || "wait"} timed out.`));
          return;
        }
        waiter.timer = setTimeout(tick, 100);
      };

      session.outputWaiters.set(waiterId, waiter);
      tick();
    });
  }

  function resetSessionHandles(session) {
    session.proc = null;
    session.bridgeControl = null;
    session.writeInput = null;
    session.csiUKeyboardProtocolEnabled = false;
    session.startupReady = false;
    session.startupReadyDeadlineAt = 0;
    session.startupSignals = {
      headerSeen: false,
      modelResolvedSeen: false,
      statusSeen: false,
      promptSeen: false,
    };
    session.recentOutput = "";
    session.lastOutputAt = 0;
    session.openedAt = 0;
  }

  function updateKeyboardProtocolState(session, text) {
    if (!text) return;
    const stateTransitions = Array.from(text.matchAll(/\x1b\[(?:>(\d+)u|(<u))/g));
    if (!stateTransitions.length) return;

    const lastTransition = stateTransitions[stateTransitions.length - 1];
    const enabled = Boolean(lastTransition[1] && Number(lastTransition[1]) > 0);
    if (session.csiUKeyboardProtocolEnabled === enabled) return;

    session.csiUKeyboardProtocolEnabled = enabled;
    emitEvent("pty.keyboard_protocol.changed", {
      kind: session.kind,
      sessionId: session.sessionId,
      protocol: "csi-u",
      enabled,
      modeValue: enabled ? Number(lastTransition[1]) : 0,
    });
  }

  function shouldWaitForProgrammaticSubmitSettle(profile, options) {
    if (profile.submitPolicy.settleDelayMs <= 0) return false;
    const settleTextModes = Array.isArray(profile.submitPolicy.settleTextModes)
      ? profile.submitPolicy.settleTextModes
      : ["csi-u-text"];
    if (!settleTextModes.includes(options.textMode)) return false;
    const textLength = Array.from(String(options.text || "")).length;
    if (textLength < profile.submitPolicy.settleMinTextLength) return false;
    return true;
  }

  function countProgrammaticSubmitTextLength(options) {
    return Array.from(String(options.text || "")).length;
  }

  function hasSemanticStartupReadySignal(session, profile) {
    if (session.startupSignals.promptSeen) return true;
    if (session.startupSignals.headerSeen && session.startupSignals.statusSeen) return true;
    if (session.startupSignals.headerSeen && session.startupSignals.modelResolvedSeen) return true;
    return session.startupSignals.modelResolvedSeen && session.startupSignals.statusSeen;
  }

  function maybeMarkStartupReady(session, profile) {
    if (session.startupReady) return;
    if (!hasSemanticStartupReadySignal(session, profile)) return;
    if (profile.startup.requireCsiU && !session.csiUKeyboardProtocolEnabled) return;
    const now = Date.now();
    if (!session.startupReadyDeadlineAt) {
      session.startupReadyDeadlineAt = now + getConfig().startupReadyDebounceMs;
      emitEvent("pty.startup.semantic_ready", {
        kind: session.kind,
        sessionId: session.sessionId,
        debounceMs: getConfig().startupReadyDebounceMs,
      });
      return;
    }
    if (now >= session.startupReadyDeadlineAt) {
      session.startupReady = true;
      emitEvent("pty.startup.ready", {
        kind: session.kind,
        sessionId: session.sessionId,
        startupSignals: session.startupSignals,
      });
    }
  }

  function updateStartupSignalState(session, profile, text) {
    const rawBuffer = `${session.recentOutput}\n${String(text || "")}`;
    const buffer = stripAnsi(rawBuffer).replace(/\r/g, "\n").slice(-24000);
    const semanticBuffer = toSemanticText(rawBuffer).slice(-12000);
    const previousSignals = JSON.stringify(session.startupSignals);

    session.recentOutput = buffer;

    if (profile.startup.headerPattern.test(buffer) || profile.startup.headerPattern.test(semanticBuffer)) {
      session.startupSignals.headerSeen = true;
    }
    if (
      (profile.startup.modelPattern.test(buffer) || profile.startup.modelPattern.test(semanticBuffer)) &&
      !/model:\s*loading/i.test(buffer) &&
      !/model:\s*loading/i.test(semanticBuffer)
    ) {
      session.startupSignals.modelResolvedSeen = true;
    }
    if (profile.startup.statusPattern.test(buffer) || profile.startup.statusPattern.test(semanticBuffer)) {
      session.startupSignals.statusSeen = true;
    }
    if (
      profile.startup.promptPattern.test(buffer) ||
      profile.startup.promptPattern.test(semanticBuffer) ||
      /[›>]\s*(run\s*\/|implement|explain|ask|what)/i.test(semanticBuffer)
    ) {
      session.startupSignals.promptSeen = true;
    }
    if (JSON.stringify(session.startupSignals) !== previousSignals) {
      emitEvent("pty.startup.signals", {
        kind: session.kind,
        sessionId: session.sessionId,
        startupSignals: session.startupSignals,
      });
    }
    maybeMarkStartupReady(session, profile);
  }

  async function waitForSessionReady(kind) {
    const session = getSession(kind);
    const profile = getProfile(kind);
    const timeoutMs = getConfig().startupTimeoutMs;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      if (!session.terminal) {
        if (session.lastErrorCode && session.lastErrorSummary) {
          throw makeError(session.lastErrorCode, session.lastErrorSummary);
        }
        throw makeError(ERROR_CODES.PTY_TERMINAL_DISPOSED, `${getProfile(kind).ux.label} terminal is not available.`);
      }
      maybeMarkStartupReady(session, profile);
      if (session.startupReady && typeof session.writeInput === "function") {
        return true;
      }
      await delay(100);
    }

    throw makeError(ERROR_CODES.PTY_VERIFY_TIMEOUT, `${getProfile(kind).ux.label} did not become ready in time.`);
  }

  async function waitForProgrammaticSubmitSettle(kind, options) {
    const session = getSession(kind);
    const profile = getProfile(kind);
    if (!shouldWaitForProgrammaticSubmitSettle(profile, options)) return false;
    const textLength = countProgrammaticSubmitTextLength(options);
    emitEvent("pty.submit.settle_wait", {
      kind: session.kind,
      sessionId: session.sessionId,
      label: options.label,
      delayMs: profile.submitPolicy.settleDelayMs,
      reason: profile.submitPolicy.settleReason,
      textLength,
    });
    await delay(profile.submitPolicy.settleDelayMs);
    return true;
  }

  return {
    clearLastError,
    refreshSessionLimits,
    rejectAllOutputWaiters,
    resetSessionHandles,
    resolveOutputWaiters,
    setLastError,
    setRecoveryState,
    updateKeyboardProtocolState,
    updateStartupSignalState,
    waitForOutputMatch,
    waitForProgrammaticSubmitSettle,
    waitForSessionReady,
  };
}

module.exports = {
  createPtySessionHelpers,
};
