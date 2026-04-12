function Button({ children, onClick, variant = "primary", size = "md", style: extraStyle = {}, disabled = false }) {
  const baseStyle = {
    border: "none", borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600,
    fontSize: size === "sm" ? 12 : 13, padding: size === "sm" ? "6px 12px" : "10px 18px",
    transition: "all 0.2s", opacity: disabled ? 0.5 : 1, fontFamily: "inherit", letterSpacing: "0.02em",
    display: "inline-flex", alignItems: "center", gap: 6,
  };
  const variants = {
    primary: { background: colors.accent, color: "#fff" },
    secondary: { background: colors.surfaceAlt, color: colors.text, border: `1px solid ${colors.border}` },
    danger: { background: "rgba(224,82,82,0.15)", color: colors.error, border: `1px solid rgba(224,82,82,0.3)` },
    ghost: { background: "transparent", color: colors.textDim },
    success: { background: colors.successDim, color: colors.success, border: `1px solid rgba(74,222,128,0.3)` },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...baseStyle, ...variants[variant], ...extraStyle }}>{children}</button>;
}

function Card({ children, title, style: extraStyle = {}, headerRight = null }) {
  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20, ...extraStyle }}>
      {title && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.text, letterSpacing: "0.02em" }}>{title}</h3>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 2, background: colors.surfaceAlt, borderRadius: 8, padding: 3 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          style={{
            flex: 1, padding: "10px 16px", border: "none", borderRadius: 6, cursor: "pointer",
            background: active === t.id ? colors.accent : "transparent",
            color: active === t.id ? "#fff" : colors.textDim,
            fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all 0.2s",
          }}
        >{t.label}</button>
      ))}
    </div>
  );
}

// ─── PANEL LAYOUT CANVAS ────────────────────────────────────────────────────
function LayoutCanvas({ panels, wallWidth, wallHeight, panelCutHeight, openings = [], isGable = false, ridgeHeight = 0, ridgeX, leftEaveH, rightEaveH, leftPanelCutHeight, rightPanelCutHeight }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !panels || panels.length === 0) return;
    const ctx = canvas.getContext("2d");
    const cw = container.offsetWidth;
    const padding = 40;
    const dimSpace = 30;
    const totalW = cw;
    const drawW = totalW - padding * 2 - dimSpace;

    const lEave = isGable ? (leftEaveH || wallHeight) : wallHeight;
    const rEave = isGable ? (rightEaveH || wallHeight) : wallHeight;
    const peakX = ridgeX || wallWidth / 2;
    const maxH = isGable && ridgeHeight > Math.max(lEave, rEave) ? ridgeHeight : Math.max(lEave, rEave, wallHeight);

    const aspect = maxH / (wallWidth || 360);
    const drawH = Math.min(drawW * aspect, 350);
    const totalH = drawH + padding * 2 + dimSpace + (isGable ? 80 : 0);
    canvas.width = totalW * 2; canvas.height = totalH * 2;
    canvas.style.width = totalW + "px"; canvas.style.height = totalH + "px";
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, totalW, totalH);
    const scaleX = drawW / wallWidth;
    const scaleY = drawH / maxH;
    const ox = padding + dimSpace;
    const oy = padding + (isGable ? 40 : 0);
    // Draw wall outline
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    if (isGable && ridgeHeight > Math.min(lEave, rEave)) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + (maxH - lEave) * scaleY);
      ctx.lineTo(ox + peakX * scaleX, oy + (maxH - ridgeHeight) * scaleY);
      ctx.lineTo(ox + wallWidth * scaleX, oy + (maxH - rEave) * scaleY);
      ctx.lineTo(ox + wallWidth * scaleX, oy + maxH * scaleY);
      ctx.lineTo(ox, oy + maxH * scaleY);
      ctx.closePath();
      ctx.stroke();
      // Ridge line indicator
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(ox + peakX * scaleX, oy + (maxH - ridgeHeight) * scaleY);
      ctx.lineTo(ox + peakX * scaleX, oy + maxH * scaleY);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.strokeRect(ox, oy, drawW, drawH);
    }
    // Draw panels
    let xOff = 0;
    panels.forEach((panel) => {
      const px = ox + xOff * scaleX;
      const pw = panel.width * scaleX;
      const pLen = panel.panelLength || wallHeight;
      const ph = pLen * scaleY;
      const py = oy + (maxH - pLen) * scaleY;
      const isCut = panel.position !== "full";
      ctx.fillStyle = isCut ? "rgba(140,74,42,0.25)" : "rgba(42,74,140,0.25)";
      if (isGable && panel.gableCut) {
        const lh = panel.gableCut.leftHeight * scaleY;
        const rh = panel.gableCut.rightHeight * scaleY;
        ctx.beginPath();
        ctx.moveTo(px, oy + (maxH - panel.gableCut.leftHeight) * scaleY);
        ctx.lineTo(px + pw, oy + (maxH - panel.gableCut.rightHeight) * scaleY);
        ctx.lineTo(px + pw, oy + maxH * scaleY);
        ctx.lineTo(px, oy + maxH * scaleY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = isCut ? colors.panelCutBorder : colors.panelFullBorder;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = isCut ? colors.panelCutBorder : colors.panelFullBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, pw, ph);
      }
      // Panel number
      ctx.fillStyle = colors.textDim;
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`#${panel.index}`, px + pw / 2, oy + maxH * scaleY - 6);
      // Width dimension on top
      ctx.fillStyle = isCut ? colors.panelCutBorder : colors.textMuted;
      ctx.font = "9px monospace";
      const topY = isGable && panel.gableCut ? oy + (maxH - Math.max(panel.gableCut.leftHeight, panel.gableCut.rightHeight)) * scaleY - 8 : py - 8;
      if (isCut) ctx.fillText(decToImperial(panel.width).display, px + pw / 2, topY);
      xOff += panel.width;
    });
    // Draw openings
    openings.forEach(op => {
      const opx = ox + op.fromLeft * scaleX;
      const opw = op.width * scaleX;
      const opy = oy + (maxH - op.fromBottom - op.height) * scaleY;
      const oph = op.height * scaleY;
      ctx.fillStyle = "rgba(15,17,23,0.8)";
      ctx.fillRect(opx, opy, opw, oph);
      ctx.strokeStyle = colors.warn;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(opx, opy, opw, oph);
      ctx.setLineDash([]);
      ctx.fillStyle = colors.warn;
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(op.label || op.type, opx + opw / 2, opy + oph / 2 + 3);
    });
    // Dimension lines — bottom: total width
    ctx.fillStyle = colors.textDim;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    const by = oy + maxH * scaleY + 18;
    ctx.strokeStyle = colors.textMuted;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(ox, by - 4); ctx.lineTo(ox, by + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox + drawW, by - 4); ctx.lineTo(ox + drawW, by + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, by); ctx.lineTo(ox + drawW, by); ctx.stroke();
    ctx.fillText(decToImperial(wallWidth).displayWithTotal, ox + drawW / 2, by + 14);
    // Left: eave height labels
    ctx.save();
    ctx.translate(ox - 18, oy + (maxH * scaleY) / 2);
    ctx.rotate(-Math.PI / 2);
    if (isGable && lEave !== rEave) {
      ctx.fillText(`L Eave: ${decToImperial(lEave).display}`, 0, 0);
    } else {
      ctx.fillText(`Eave: ${decToImperial(wallHeight).display}`, 0, 0);
    }
    ctx.restore();
    // Right eave label (if asymmetric)
    if (isGable && lEave !== rEave) {
      ctx.save();
      ctx.translate(ox + drawW + 14, oy + (maxH * scaleY) / 2);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(`R Eave: ${decToImperial(rEave).display}`, 0, 0);
      ctx.restore();
    }
    // Panel cut height indicators
    if (!isGable) {
      const pch = panelCutHeight || wallHeight;
      if (pch && pch !== wallHeight) {
        const pchY = oy + (maxH - pch) * scaleY;
        ctx.strokeStyle = colors.success;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(ox, pchY); ctx.lineTo(ox + drawW, pchY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = colors.success;
        ctx.font = "9px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`Panel cut: ${decToImperial(pch).display}`, ox + 4, pchY - 4);
      }
    }
    // Ridge label
    if (isGable && ridgeHeight > Math.min(lEave, rEave)) {
      ctx.fillStyle = colors.accent;
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`Ridge: ${decToImperial(ridgeHeight).display}`, ox + peakX * scaleX, oy + (maxH - ridgeHeight) * scaleY - 6);
      // Ridge X offset label
      if (peakX !== wallWidth / 2) {
        ctx.fillStyle = colors.textMuted;
        ctx.font = "8px monospace";
        ctx.fillText(`(${decToImperial(peakX).display} from left)`, ox + peakX * scaleX, oy + maxH * scaleY + 10);
      }
    }
  }, [panels, wallWidth, wallHeight, panelCutHeight, openings, isGable, ridgeHeight, ridgeX, leftEaveH, rightEaveH]);

  return (
    <div ref={containerRef} style={{ width: "100%", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%" }} />
    </div>
  );
}

// ─── OPENING EDITOR ─────────────────────────────────────────────────────────
function OpeningEditor({ openings, onChange, wallWidth, wallHeight }) {
  const addOpening = () => {
    onChange([...openings, { id: Date.now(), type: "window", label: "W" + (openings.length + 1), fromLeft: 48, fromBottom: 36, width: 36, height: 48 }]);
  };
  const update = (id, field, val) => {
    onChange(openings.map(o => o.id === id ? { ...o, [field]: val } : o));
  };
  const remove = (id) => onChange(openings.filter(o => o.id !== id));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: colors.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Openings ({openings.length})
        </span>
        <Button onClick={addOpening} size="sm" variant="secondary">+ Add Opening</Button>
      </div>
      {openings.map(op => (
        <div key={op.id} style={{ background: colors.surfaceAlt, borderRadius: 8, padding: 12, border: `1px solid ${colors.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={op.type} onChange={(e) => update(op.id, "type", e.target.value)}
                style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 12, fontFamily: "inherit" }}>
                <option value="window">Window</option>
                <option value="door">Door</option>
                <option value="ohd">OH Door</option>
                <option value="louver">Louver</option>
                <option value="other">Other</option>
              </select>
              <input value={op.label} onChange={(e) => update(op.id, "label", e.target.value)}
                style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 12, width: 60, fontFamily: "monospace" }}
                placeholder="Label" />
            </div>
            <Button onClick={() => remove(op.id)} variant="danger" size="sm">Remove</Button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <MeasurementInput label="From Left" value={op.fromLeft} onChange={(v) => v != null && update(op.id, "fromLeft", v)} compact />
            <MeasurementInput label="From Bottom" value={op.fromBottom} onChange={(v) => v != null && update(op.id, "fromBottom", v)} compact />
            <MeasurementInput label="Width" value={op.width} onChange={(v) => v != null && update(op.id, "width", v)} compact />
            <MeasurementInput label="Height" value={op.height} onChange={(v) => v != null && update(op.id, "height", v)} compact />
          </div>
        </div>
      ))}
    </div>
  );
}
