function createPtyTerminalManager({
  BRIDGE_SCRIPT,
  ERROR_CODES,
  RECOVERY_STATES,
  appendDebugEvent,
  appendLiveLog,
  appendOutputLine,
  childProcess,
  emitEvent,
  getCommandSettingKey,
  getProfile,
  getSession,
  getWorkspaceRootFsPath,
  isActiveSession,
  makeError,
  normalizeTerminalDimensions,
  rejectAllOutputWaiters,
  resetSessionHandles,
  resolveOutputWaiters,
  resolvePythonExecutable,
  setLastError,
  setRecoveryState,
  updateKeyboardProtocolState,
  updateStartupSignalState,
  vscode,
}) {
  function classifyUnexpectedExit(kind, session, profile, exitCode, signal) {
    const defaultSummary =
      exitCode === 127
        ? `PTY launch failed: command '${profile.command}' is not available on PATH. Install the CLI or update ivyhouseTerminalPty.${getCommandSettingKey(kind)}.`
        : `PTY process exited code=${exitCode}${signal ? ` signal=${signal}` : ""}`;

    if (kind !== "copilot") {
      return { errorCode: ERROR_CODES.PTY_CHILD_EXITED, summary: defaultSummary };
    }

    const startupSignals = session.startupSignals || {};
    const sawStartupSignal = Object.values(startupSignals).some(Boolean);
    const startupWindowMs = Math.max(500, Number(profile.startup?.unsupportedContractExitWindowMs) || 3000);
    const lifetimeMs = session.openedAt ? Date.now() - session.openedAt : Number.POSITIVE_INFINITY;

    if (!session.startupReady && !sawStartupSignal && lifetimeMs <= startupWindowMs) {
      return {
        errorCode: ERROR_CODES.PTY_UNSUPPORTED_STARTUP_CONTRACT,
        summary:
          "Copilot PTY exited before any interactive startup markers appeared. The current Copilot CLI plain launch does not satisfy this PTY tool's persistent-session startup contract in this environment.",
      };
    }

    return { errorCode: ERROR_CODES.PTY_CHILD_EXITED, summary: defaultSummary };
  }

  function createPtyTerminal(context, kind) {
    const session = getSession(kind);
    const profile = getProfile(kind);
    resetSessionHandles(session);
    const writeEmitter = new vscode.EventEmitter();
    const closeEmitter = new vscode.EventEmitter();
    const workspaceRoot = getWorkspaceRootFsPath();
    const pythonExec = resolvePythonExecutable();
    const sessionId = `${kind}-pty-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

    let bridgeProc;
    let closed = false;
    let sessionClosed = false;
    let closeKillTimer = null;
    let closeExpectation = null;
    let resolveSessionClosed;
    const sessionClosedPromise = new Promise((resolve) => {
      resolveSessionClosed = resolve;
    });

    const markExpectedClose = (reason) => {
      if (!closeExpectation) closeExpectation = { reason };
      const barrier = session.sessionCloseBarrier;
      if (barrier?.sessionId === sessionId) {
        barrier.closeRequested = true;
        barrier.closeReason = barrier.closeReason || reason;
      }
    };

    const getExpectedCloseReason = () => {
      if (closeExpectation?.reason) return closeExpectation.reason;
      const barrier = session.sessionCloseBarrier;
      if (barrier?.sessionId === sessionId && barrier.closeRequested) {
        return barrier.closeReason || "expected_close";
      }
      return null;
    };

    const finalizeSessionClose = (reason) => {
      if (sessionClosed) return;
      sessionClosed = true;
      if (closeKillTimer) {
        clearTimeout(closeKillTimer);
        closeKillTimer = null;
      }
      if (session.sessionCloseBarrier?.sessionId === sessionId) {
        session.sessionCloseBarrier = null;
      }
      emitEvent("pty.session.closed", { kind, sessionId, reason });
      resolveSessionClosed({ sessionId, reason });
    };

    const closeWithCode = (code = 0) => {
      if (closed) return;
      closed = true;
      emitEvent("pty.close.emitted", { kind, sessionId, code });
      closeEmitter.fire(code);
    };

    const pty = {
      onDidWrite: writeEmitter.event,
      onDidClose: closeEmitter.event,
      open: (initialDimensions) => {
        const dims = normalizeTerminalDimensions(initialDimensions);
        session.openedAt = Date.now();
        appendDebugEvent(kind, {
          type: "pty_open",
          sessionId,
          workspaceRoot,
          command: profile.command,
          pythonExec,
          initialDimensions: dims,
        });
        const launchText =
          `Launching ${profile.command} inside a Python PTY bridge...\r\n` +
          `cwd: ${workspaceRoot}\r\n` +
          `python: ${pythonExec}\r\n` +
          `size: ${dims.columns}x${dims.rows}\r\n\r\n`;
        writeEmitter.fire(launchText);
        appendLiveLog(kind, launchText.replace(/\r\n/g, "\n"));
        appendOutputLine(`[start:${kind}] ${profile.command} session=${sessionId}`);

        try {
          bridgeProc = childProcess.spawn(
            pythonExec,
            [
              BRIDGE_SCRIPT,
              "--cwd",
              workspaceRoot,
              "--cols",
              String(dims.columns),
              "--rows",
              String(dims.rows),
              "--",
              profile.command,
            ],
            {
              cwd: workspaceRoot,
              env: {
                ...process.env,
                TERM: process.env.TERM || "xterm-256color",
                COLORTERM: process.env.COLORTERM || "truecolor",
              },
              stdio: ["pipe", "pipe", "pipe", "pipe"],
            },
          );
        } catch (error) {
          const message = `Failed to start PTY session: ${String(error || "")}\r\n`;
          writeEmitter.fire(message);
          appendLiveLog(kind, message.replace(/\r\n/g, "\n"));
          appendDebugEvent(kind, { type: "spawn_failure", sessionId, error: String(error || "") });
          finalizeSessionClose("spawn_failure");
          closeWithCode(1);
          return;
        }

        session.proc = bridgeProc;
        session.bridgeControl = bridgeProc.stdio?.[3];
        session.sessionId = sessionId;
        session.writeInput = (text) => {
          const activeSession = isActiveSession(session, sessionId);
          const writable = activeSession && Boolean(bridgeProc?.stdin?.writable);
          appendDebugEvent(kind, {
            type: "write_input",
            sessionId,
            pid: bridgeProc?.pid,
            activeSession,
            writable,
            textPreview: JSON.stringify(String(text || "").slice(0, 240)),
            textLength: String(text || "").length,
          });
          if (!writable) return false;
          bridgeProc.stdin.write(text);
          return true;
        };
        session.sessionCloseBarrier = {
          sessionId,
          promise: sessionClosedPromise,
          closeRequested: false,
          closeReason: null,
        };

        bridgeProc.stdout.on("data", (chunk) => {
          const text = Buffer.from(chunk).toString("utf8");
          const activeSession = isActiveSession(session, sessionId);
          if (activeSession) {
            session.lastOutputAt = Date.now();
            updateKeyboardProtocolState(session, text);
            updateStartupSignalState(session, profile, text);
          }
          appendDebugEvent(kind, {
            type: "stdout_data",
            sessionId,
            pid: bridgeProc.pid,
            activeSession,
            bytes: Buffer.byteLength(text, "utf8"),
            textPreview: JSON.stringify(text.slice(0, 240)),
          });
          writeEmitter.fire(text);
          appendLiveLog(kind, text);
          if (activeSession) {
            resolveOutputWaiters(session, text);
          }
        });

        bridgeProc.stderr.on("data", (chunk) => {
          const text = Buffer.from(chunk).toString("utf8");
          const activeSession = isActiveSession(session, sessionId);
          if (activeSession) {
            session.lastOutputAt = Date.now();
          }
          appendDebugEvent(kind, {
            type: "stderr_data",
            sessionId,
            pid: bridgeProc.pid,
            activeSession,
            bytes: Buffer.byteLength(text, "utf8"),
            textPreview: JSON.stringify(text.slice(0, 240)),
          });
          writeEmitter.fire(text);
          appendLiveLog(kind, text);
        });

        bridgeProc.on("error", (error) => {
          const activeSession = isActiveSession(session, sessionId);
          if (activeSession) {
            rejectAllOutputWaiters(
              session,
              makeError(ERROR_CODES.PTY_PIPE_BROKEN, `PTY process error: ${String(error || "")}`),
            );
          }
          appendDebugEvent(kind, {
            type: "process_error",
            sessionId,
            pid: bridgeProc.pid,
            activeSession,
            error: String(error || ""),
          });
          if (activeSession) {
            setLastError(
              session,
              ERROR_CODES.PTY_PIPE_BROKEN,
              `PTY process error: ${String(error || "")}`,
              session.lastFailedCommand,
            );
            setRecoveryState(session, RECOVERY_STATES.REBUILDABLE, "pty process error", {
              kind,
              sessionId,
              errorCode: ERROR_CODES.PTY_PIPE_BROKEN,
            });
          }
          finalizeSessionClose("process_error");
          closeWithCode(1);
        });

        bridgeProc.on("exit", (code, signal) => {
          const activeSession = isActiveSession(session, sessionId);
          const exitCode = typeof code === "number" ? code : 0;
          const { errorCode, summary } = classifyUnexpectedExit(kind, session, profile, exitCode, signal);
          const expectedCloseReason = getExpectedCloseReason();
          const expectedClose = Boolean(expectedCloseReason);
          const exitText = `\r\n[pty:${kind}] ${summary}\r\n`;
          writeEmitter.fire(exitText);
          appendLiveLog(kind, `\n[pty:${kind}] ${summary}\n`);
          appendDebugEvent(kind, {
            type: "process_exit",
            sessionId,
            pid: bridgeProc.pid,
            code: exitCode,
            signal: signal || null,
            activeSession,
            expectedClose,
            expectedCloseReason,
          });
          if (activeSession) {
            rejectAllOutputWaiters(session, makeError(errorCode, summary));
            if (!expectedClose) {
              setLastError(session, errorCode, summary, session.lastFailedCommand);
              if (errorCode !== ERROR_CODES.PTY_UNSUPPORTED_STARTUP_CONTRACT) {
                setRecoveryState(session, RECOVERY_STATES.REBUILDABLE, "pty process exited", {
                  kind,
                  sessionId,
                  errorCode,
                });
              }
            } else {
              emitEvent("pty.process_exit.expected", {
                kind,
                sessionId,
                code: exitCode,
                signal: signal || null,
                reason: expectedCloseReason,
              });
            }
            resetSessionHandles(session);
            if (session.sessionId === sessionId) {
              session.sessionId = null;
            }
          }
          finalizeSessionClose(expectedCloseReason || "process_exit");
          closeWithCode(exitCode);
        });
      },
      close: () => {
        markExpectedClose("terminal_close_requested");
        appendDebugEvent(kind, {
          type: "pty_close_requested",
          sessionId,
          pid: bridgeProc?.pid,
          hasProc: Boolean(bridgeProc),
          reason: getExpectedCloseReason(),
        });
        if (!bridgeProc) {
          rejectAllOutputWaiters(
            session,
            makeError(ERROR_CODES.PTY_TERMINAL_DISPOSED, "PTY terminal was closed before output waiters completed."),
          );
          resetSessionHandles(session);
          finalizeSessionClose("close_without_process");
          closeWithCode(0);
          return;
        }

        try {
          bridgeProc.kill("SIGTERM");
        } catch {
          // ignore
        }

        const forceKillDelayMs = Math.max(0, Number(profile.closePolicy?.forceKillDelayMs) || 0);
        if (forceKillDelayMs > 0) {
          closeKillTimer = setTimeout(() => {
            if (sessionClosed) return;
            if (bridgeProc && bridgeProc.exitCode === null && bridgeProc.signalCode === null) {
              appendDebugEvent(kind, {
                type: "pty_close_force_kill",
                sessionId,
                pid: bridgeProc.pid,
                reason: getExpectedCloseReason(),
                delayMs: forceKillDelayMs,
              });
              try {
                bridgeProc.kill("SIGKILL");
              } catch {
                // ignore
              }
            }
            closeKillTimer = null;
          }, forceKillDelayMs);
        }

        rejectAllOutputWaiters(
          session,
          makeError(ERROR_CODES.PTY_TERMINAL_DISPOSED, "PTY terminal was closed before output waiters completed."),
        );
        closeWithCode(0);
      },
      handleInput: (data) => {
        appendDebugEvent(kind, {
          type: "handle_input",
          sessionId,
          pid: bridgeProc?.pid,
          writable: Boolean(bridgeProc?.stdin?.writable),
          textPreview: JSON.stringify(String(data || "").slice(0, 240)),
        });
        if (!bridgeProc?.stdin?.writable) return;
        try {
          bridgeProc.stdin.write(data);
        } catch {
          // ignore
        }
      },
      setDimensions: (dimensions) => {
        const normalized = normalizeTerminalDimensions(dimensions);
        appendDebugEvent(kind, { type: "set_dimensions", sessionId, dimensions: normalized });
        if (!session.bridgeControl?.writable) return;
        try {
          session.bridgeControl.write(`${JSON.stringify({ type: "resize", cols: normalized.columns, rows: normalized.rows })}\n`);
        } catch (error) {
          appendDebugEvent(kind, {
            type: "set_dimensions_forward_error",
            sessionId,
            error: String(error || ""),
            dimensions: normalized,
          });
        }
      },
    };

    const terminal = vscode.window.createTerminal({ name: profile.terminalName, pty });
    session.sessionId = sessionId;
    session.terminal = terminal;
    context.subscriptions.push(writeEmitter, closeEmitter, terminal);
    emitEvent("terminal_created", { kind, sessionId, terminalName: profile.terminalName });
    return terminal;
  }

  return {
    createPtyTerminal,
  };
}

module.exports = {
  createPtyTerminalManager,
};
