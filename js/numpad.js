// ─── CUSTOM NUMPAD CONTEXT ──────────────────────────────────────────────────
// Global state for which input has the numpad open.
// We use a simple pub/sub so the overlay and inputs stay in sync.
const numpadState = { activeId: null, listeners: new Set() };
function setNumpadActive(id) { numpadState.activeId = id; numpadState.listeners.forEach(fn => fn(id)); }
function useNumpadActive() {
  const [id, setId] = useState(numpadState.activeId);
  useEffect(() => { numpadState.listeners.add(setId); return () => numpadState.listeners.delete(setId); }, []);
  return id;
}

// ─── NUMPAD OVERLAY ─────────────────────────────────────────────────────────
function NumpadOverlay() {
  const activeId = useNumpadActive();
  const [buffer, setBuffer] = useState("");
  const lastActiveRef = useRef(null);

  useEffect(() => {
    if (activeId && activeId !== lastActiveRef.current) {
      // When switching to a new input, load its current value into the buffer
      const el = document.getElementById(activeId);
      if (el) setBuffer(el.getAttribute("data-raw") || "");
      lastActiveRef.current = activeId;
    }
  }, [activeId]);

  if (!activeId) return null;

  const dispatch = (val) => {
    const el = document.getElementById(activeId);
    if (!el) return;
    // Dispatch a custom event with the updated buffer
    const newBuf = val === null ? "" : val;
    setBuffer(newBuf);
    el.dispatchEvent(new CustomEvent("numpad-input", { detail: { value: newBuf } }));
  };

  const press = (key) => {
    if (key === "BS") {
      const newBuf = buffer.slice(0, -1);
      dispatch(newBuf);
    } else if (key === "CLR") {
      dispatch("");
    } else if (key === "ENTER") {
      setNumpadActive(null);
      lastActiveRef.current = null;
    } else {
      const newBuf = buffer + key;
      dispatch(newBuf);
    }
  };

  const parsed = parseImperialInput(buffer);
  const imperial = parsed != null ? decToImperial(parsed) : null;

  const btnStyle = (special) => ({
    display: "flex", alignItems: "center", justifyContent: "center",
    background: special === "enter" ? colors.accent : special === "fn" ? colors.surfaceAlt : "#1A2035",
    border: `1px solid ${special === "enter" ? colors.accentDim : "#2A3050"}`,
    borderRadius: 10, color: special === "enter" ? "#fff" : colors.text,
    fontSize: special === "fn" ? 20 : 26, fontWeight: 600,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    cursor: "pointer", userSelect: "none", WebkitTapHighlightColor: "transparent",
    minHeight: 56, transition: "background 0.1s",
  });

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: colors.bg, borderTop: `1px solid ${colors.border}`,
      padding: "8px 8px env(safe-area-inset-bottom, 8px)",
    }}>
      {/* Display bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 14px", marginBottom: 6, background: colors.surface,
        borderRadius: 8, border: `1px solid ${colors.border}`,
      }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: colors.text, minHeight: 24, letterSpacing: "0.05em" }}>
          {buffer || <span style={{ color: colors.textMuted }}>—</span>}
        </div>
        <div style={{ fontSize: 12, color: imperial ? colors.accent : colors.textMuted, fontFamily: "monospace" }}>
          {imperial ? imperial.displayWithTotal : buffer ? "..." : ""}
        </div>
      </div>
      {/* Numpad grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
        {["1","2","3","4","5","6","7","8","9"].map(k => (
          <div key={k} style={btnStyle()} onClick={() => press(k)} onTouchStart={(e) => { e.currentTarget.style.background = "#2A3A60"; }} onTouchEnd={(e) => { e.currentTarget.style.background = "#1A2035"; }}>{k}</div>
        ))}
        <div style={btnStyle("fn")} onClick={() => press("'")}>{'  \u2032  '}</div>
        <div style={btnStyle()} onClick={() => press("0")}>0</div>
        <div style={btnStyle("fn")} onClick={() => press('"')}>{' \u2033 '}</div>
      </div>
      {/* Bottom row: /, ., backspace, enter */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5, marginTop: 5 }}>
        <div style={btnStyle("fn")} onClick={() => press("/")}>/</div>
        <div style={btnStyle("fn")} onClick={() => press(".")}>.</div>
        <div style={btnStyle("fn")} onClick={() => press("BS")}>⌫</div>
        <div style={btnStyle("enter")} onClick={() => press("ENTER")}>↵</div>
      </div>
    </div>
  );
}

function MeasurementInput({ value, onChange, label, placeholder = "e.g. 10-6-1/4", compact = false }) {
  const [raw, setRaw] = useState(value != null ? String(value) : "");
  const [valid, setValid] = useState(true);
  const inputId = useRef("mi-" + Math.random().toString(36).slice(2, 9)).current;
  const activeId = useNumpadActive();
  const isActive = activeId === inputId;

  const processValue = useCallback((v) => {
    setRaw(v);
    const parsed = parseImperialInput(v);
    if (parsed !== null) { setValid(true); onChange(parsed); }
    else if (v === "") { setValid(true); onChange(null); }
    else setValid(false);
  }, [onChange]);

  // Listen for numpad events
  useEffect(() => {
    const el = document.getElementById(inputId);
    if (!el) return;
    const handler = (e) => processValue(e.detail.value);
    el.addEventListener("numpad-input", handler);
    return () => el.removeEventListener("numpad-input", handler);
  }, [inputId, processValue]);

  const handleTap = () => {
    setNumpadActive(inputId);
  };

  const parsed = parseImperialInput(raw);
  const imperial = parsed != null ? decToImperial(parsed) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: compact ? "1" : undefined }}>
      {label && <label style={{ fontSize: 11, color: colors.textDim, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>}
      <div
        id={inputId}
        data-raw={raw}
        onClick={handleTap}
        style={{
          background: colors.surfaceAlt,
          border: `1px solid ${isActive ? colors.borderFocus : (valid ? colors.border : colors.error)}`,
          borderRadius: 6, color: raw ? colors.text : colors.textMuted,
          padding: compact ? "8px 10px" : "10px 12px", fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          width: "100%", boxSizing: "border-box", transition: "border-color 0.2s",
          cursor: "pointer", userSelect: "none", minHeight: compact ? 36 : 42,
        }}
      >
        {raw || placeholder}
      </div>
      {imperial && !isActive && (
        <span style={{ fontSize: 11, color: colors.accent, fontFamily: "monospace" }}>{imperial.displayWithTotal}</span>
      )}
    </div>
  );
}
