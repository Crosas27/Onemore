// ─── CUT LIST DISPLAY ───────────────────────────────────────────────────────
function CutListDisplay({ walls }) {
  if (!walls || walls.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {walls.map((wall, wi) => {
        if (!wall.selectedVariation || !wall.computedPanels) return null;
        return (
          <Card key={wi} title={`${wall.name} — Cut List`} style={{ background: colors.bg }}>
            <div style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12, color: colors.text }}>
              {/* Wall header info */}
              <div style={{ color: colors.textDim, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${colors.border}`, lineHeight: 1.8, fontSize: 11 }}>
                <div>Wall: {decToImperial(wall.width).displayWithTotal} wide × {decToImperial(wall.height).displayWithTotal} eave height</div>
                <div>Panel Cut Height: {decToImperial(wall.panelCutHeight || wall.height).displayWithTotal}{wall.panelCutHeight && wall.panelCutHeight !== wall.height ? ` (${decToImperial(wall.height - wall.panelCutHeight).display} below eave)` : ""}</div>
                <div>Profile: {wall.profileName} · Coverage: {decToImperial(wall.profileCoverage).display}</div>
                <div>Layout: {wall.selectedVariation.name}</div>
                {wall.isGable && (
                  <div style={{ color: colors.accent }}>
                    Gable End · Ridge: {decToImperial(wall.ridgeHeight).displayWithTotal}
                    {wall.ridgeX && wall.width && wall.ridgeX !== wall.width / 2 ? ` · Ridge X: ${decToImperial(wall.ridgeX).display} from left` : ""}
                    {wall.leftEaveH && wall.rightEaveH && wall.leftEaveH !== wall.rightEaveH
                      ? ` · L Eave: ${decToImperial(wall.leftEaveH).display} · R Eave: ${decToImperial(wall.rightEaveH).display}`
                      : ""}
                  </div>
                )}
              </div>
              {/* Panel table */}
              <div style={{ overflowX: "auto" }}>
                {wall.computedPanels.map((p, pi) => {
                  const row = buildPanelRow(p, wall);
                  return (
                    <div key={pi} style={{
                      display: "flex", alignItems: "center", gap: 0,
                      padding: "8px 0", borderBottom: `1px solid ${colors.border}`,
                      background: pi % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                    }}>
                      {/* Panel number */}
                      <div style={{ width: 36, flexShrink: 0, fontSize: 13, fontWeight: 700, color: colors.textDim, textAlign: "center" }}>
                        {row.num}
                      </div>
                      {/* Left Height */}
                      <div style={{ flex: 1, paddingLeft: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>
                          {row.lDisplay}
                        </div>
                        <div style={{ fontSize: 10, color: colors.textDim }}>
                          {row.lTotal}
                        </div>
                      </div>
                      {/* Arrow */}
                      <div style={{ width: 30, textAlign: "center", fontSize: 14, color: row.isAngle ? colors.warn : colors.textMuted, flexShrink: 0 }}>
                        {row.arrow}
                      </div>
                      {/* Right Height */}
                      <div style={{ flex: 1, paddingLeft: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: row.isAngle ? colors.warn : colors.text }}>
                          {row.rDisplay}
                        </div>
                        <div style={{ fontSize: 10, color: colors.textDim }}>
                          {row.rTotal}
                        </div>
                      </div>
                      {/* Notes */}
                      <div style={{ flex: 1.2, paddingLeft: 8, fontSize: 10, color: row.notes !== "full panel" ? colors.warn : colors.textMuted, lineHeight: 1.5 }}>
                        {row.notes}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Footer summary */}
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${colors.border}`, color: colors.textDim, fontSize: 11, lineHeight: 1.8 }}>
                <div>Total panels: {wall.computedPanels.length} · Full sheets needed: {wall.selectedVariation.sheetsNeeded}</div>
                <div>Waste: {decToImperial(wall.selectedVariation.wasteInches).display} ({wall.selectedVariation.wastePercent.toFixed(1)}%)</div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── EXPORT ─────────────────────────────────────────────────────────────────
function generateExportText(walls, projectName) {
  let text = `╔══════════════════════════════════════════╗\n`;
  text += `║  PANEL CUT LIST — ${projectName || "Project"}  \n`;
  text += `║  Generated: ${new Date().toLocaleDateString()}              \n`;
  text += `╚══════════════════════════════════════════╝\n\n`;
  walls.forEach((wall, wi) => {
    if (!wall.selectedVariation || !wall.computedPanels) return;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `  ${wall.name}\n`;
    text += `  ${decToImperial(wall.width).displayWithTotal} W × ${decToImperial(wall.height).displayWithTotal} Eave H\n`;
    text += `  Panel Cut Height: ${decToImperial(wall.panelCutHeight || wall.height).displayWithTotal}${wall.panelCutHeight && wall.panelCutHeight !== wall.height ? ` (${decToImperial(wall.height - wall.panelCutHeight).display} below eave)` : ""}\n`;
    text += `  Profile: ${wall.profileName} (${decToImperial(wall.profileCoverage).display} coverage)\n`;
    text += `  Layout: ${wall.selectedVariation.name}\n`;
    if (wall.isGable) {
      const lEave = wall.leftEaveH || wall.height;
      const rEave = wall.rightEaveH || wall.height;
      const rX = wall.ridgeX || wall.width / 2;
      text += `  Gable End · Ridge: ${decToImperial(wall.ridgeHeight).displayWithTotal}`;
      if (rX !== wall.width / 2) text += ` · Ridge X: ${decToImperial(rX).display} from left`;
      text += `\n`;
      if (lEave !== rEave) {
        text += `  L Eave: ${decToImperial(lEave).display} · R Eave: ${decToImperial(rEave).display}\n`;
      }
      if (wall.leftPanelCutHeight || wall.rightPanelCutHeight) {
        text += `  L Panel Cut: ${decToImperial(wall.leftPanelCutHeight || lEave).display} · R Panel Cut: ${decToImperial(wall.rightPanelCutHeight || rEave).display}\n`;
      }
    }
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `  #   LEFT HEIGHT         →  RIGHT HEIGHT        NOTES\n`;
    text += `  ─── ─────────────────── ── ─────────────────── ──────────────────\n`;
    wall.computedPanels.forEach(p => {
      const row = buildPanelRow(p, wall);
      const lStr = `${row.lDisplay} (${row.lTotal})`.padEnd(19);
      const rStr = `${row.rDisplay} (${row.rTotal})`.padEnd(19);
      text += `  ${row.num}  ${lStr}${row.arrow}  ${rStr}${row.notes}\n`;
    });
    text += `\n  Panels: ${wall.computedPanels.length} · Sheets: ${wall.selectedVariation.sheetsNeeded} · Waste: ${decToImperial(wall.selectedVariation.wasteInches).display} (${wall.selectedVariation.wastePercent.toFixed(1)}%)\n\n`;
  });
  // Summary
  const totalPanels = walls.reduce((s, w) => s + (w.computedPanels?.length || 0), 0);
  const totalSheets = walls.reduce((s, w) => s + (w.selectedVariation?.sheetsNeeded || 0), 0);
  text += `══════════════════════════════════════════\n`;
  text += `  PROJECT SUMMARY\n`;
  text += `  Total panels across all walls: ${totalPanels}\n`;
  text += `  Total sheets to order: ${totalSheets}\n`;
  text += `══════════════════════════════════════════\n`;
  return text;
}

// ─── WALL EDITOR ────────────────────────────────────────────────────────────
function WallEditor({ wall, profiles, onUpdate, onRemove }) {
  const [showOpenings, setShowOpenings] = useState(false);
  const profile = profiles.find(p => p.id === wall.profileId) || profiles[0];
  const variations = useMemo(() => {
    if (!wall.width || !profile) return [];
    return generateLayoutVariations(wall.width, profile.coverage);
  }, [wall.width, profile?.coverage]);

  const selectedVar = wall.selectedVariationId ? variations.find(v => v.id === wall.selectedVariationId) : variations[0];

  const computedPanels = useMemo(() => {
    if (!selectedVar || !wall.height) return [];
    // Build gable geometry object for asymmetric support
    // Symmetric: leftEaveH == rightEaveH == wall.height, ridgeX == wallWidth/2
    // Asymmetric: independent left/right eave heights, ridge offset
    const leftEaveH = wall.isGable ? (wall.leftEaveH || wall.height) : wall.height;
    const rightEaveH = wall.isGable ? (wall.rightEaveH || wall.height) : wall.height;
    const leftPCH = wall.isGable ? (wall.leftPanelCutHeight || wall.panelCutHeight || leftEaveH) : (wall.panelCutHeight || wall.height);
    const rightPCH = wall.isGable ? (wall.rightPanelCutHeight || wall.panelCutHeight || rightEaveH) : (wall.panelCutHeight || wall.height);
    const ridgeX = wall.isGable ? (wall.ridgeX || wall.width / 2) : wall.width / 2;

    let panels = [...selectedVar.panels];
    if (wall.isGable && wall.ridgeHeight && (wall.ridgeHeight > leftEaveH || wall.ridgeHeight > rightEaveH)) {
      const gable = { leftEaveH, rightEaveH, ridgeH: wall.ridgeHeight, ridgeX, leftPCH, rightPCH };
      panels = computeGableAngleCuts(wall.width, gable, profile.coverage, panels);
    } else {
      const pch = wall.panelCutHeight || wall.height;
      panels = panels.map(p => ({ ...p, panelLength: pch }));
    }
    if (wall.openings && wall.openings.length > 0) {
      panels = computeOpeningCuts(panels, wall.openings, wall.height);
    }
    return panels;
  }, [selectedVar, wall.height, wall.panelCutHeight, wall.isGable, wall.ridgeHeight, wall.leftEaveH, wall.rightEaveH, wall.leftPanelCutHeight, wall.rightPanelCutHeight, wall.ridgeX, wall.openings, wall.width, profile?.coverage]);

  useEffect(() => {
    if (selectedVar && computedPanels.length > 0) {
      onUpdate({
        selectedVariation: selectedVar,
        computedPanels,
        profileName: profile.name,
        profileCoverage: profile.coverage,
        panelCutHeight: wall.panelCutHeight,
      });
    }
  }, [selectedVar, computedPanels]);

  return (
    <Card title={wall.name} headerRight={<Button onClick={onRemove} variant="danger" size="sm">Remove Wall</Button>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Wall Name & Profile */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: colors.textDim, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Wall Name</label>
            <input value={wall.name} onChange={(e) => onUpdate({ name: e.target.value })}
              style={{ background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.text, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, color: colors.textDim, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Panel Profile</label>
            <select value={wall.profileId} onChange={(e) => onUpdate({ profileId: e.target.value })}
              style={{ background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.text, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", outline: "none" }}>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.name} ({p.coverage}")</option>)}
            </select>
          </div>
        </div>
        {/* Dimensions — base wall */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <MeasurementInput label="Wall Width" value={wall.width} onChange={(v) => onUpdate({ width: v })} />
          <MeasurementInput label="Eave Height (sidewall default)" value={wall.height} onChange={(v) => onUpdate({ height: v })} placeholder="Structural eave height" />
        </div>
        {/* Panel Cut Height — non-gable walls */}
        {!wall.isGable && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MeasurementInput label="Panel Cut Height (base to underside of eave)" value={wall.panelCutHeight} onChange={(v) => onUpdate({ panelCutHeight: v })} placeholder="Defaults to eave height" />
            <div style={{ display: "flex", flexDirection: "column", gap: 4, justifyContent: "flex-end" }}>
              {wall.height && wall.panelCutHeight && wall.panelCutHeight !== wall.height && (
                <span style={{ fontSize: 11, color: colors.warn, fontFamily: "monospace" }}>
                  Eave offset: {decToImperial(wall.height - wall.panelCutHeight).display} shorter than eave
                </span>
              )}
              {wall.height && !wall.panelCutHeight && (
                <span style={{ fontSize: 11, color: colors.textMuted, fontFamily: "monospace" }}>
                  Defaults to eave height if left blank
                </span>
              )}
            </div>
          </div>
        )}
        {/* Gable toggle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: colors.text }}>
            <input type="checkbox" checked={wall.isGable || false} onChange={(e) => onUpdate({ isGable: e.target.checked })}
              style={{ accentColor: colors.accent, width: 16, height: 16 }} />
            Gable End Wall
          </label>
          {wall.isGable && (
            <div style={{ background: colors.surfaceAlt, borderRadius: 8, padding: 14, border: `1px solid ${colors.border}`, display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Ridge */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <MeasurementInput label="Ridge Height (peak)" value={wall.ridgeHeight} onChange={(v) => onUpdate({ ridgeHeight: v })} compact placeholder="e.g. 16-0" />
                <MeasurementInput label="Ridge X Offset (from left)" value={wall.ridgeX} onChange={(v) => onUpdate({ ridgeX: v })} compact placeholder={wall.width ? `Center: ${decToImperial(wall.width / 2).display}` : "e.g. 25-0"} />
              </div>
              {wall.width && !wall.ridgeX && (
                <span style={{ fontSize: 10, color: colors.textMuted, fontFamily: "monospace", marginTop: -8 }}>
                  Ridge X defaults to center ({decToImperial(wall.width / 2).display}) if left blank
                </span>
              )}
              {/* Left side */}
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 10 }}>
                <div style={{ fontSize: 10, color: colors.accent, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Left Side</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <MeasurementInput label="Left Eave Height" value={wall.leftEaveH} onChange={(v) => onUpdate({ leftEaveH: v })} compact placeholder={wall.height ? `Same as eave: ${decToImperial(wall.height).display}` : ""} />
                  <MeasurementInput label="Left Panel Cut Height" value={wall.leftPanelCutHeight} onChange={(v) => onUpdate({ leftPanelCutHeight: v })} compact placeholder="Defaults to left eave" />
                </div>
              </div>
              {/* Right side */}
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 10 }}>
                <div style={{ fontSize: 10, color: colors.accent, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Right Side</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <MeasurementInput label="Right Eave Height" value={wall.rightEaveH} onChange={(v) => onUpdate({ rightEaveH: v })} compact placeholder={wall.height ? `Same as eave: ${decToImperial(wall.height).display}` : ""} />
                  <MeasurementInput label="Right Panel Cut Height" value={wall.rightPanelCutHeight} onChange={(v) => onUpdate({ rightPanelCutHeight: v })} compact placeholder="Defaults to right eave" />
                </div>
              </div>
              {/* Computed gable info */}
              {wall.ridgeHeight && wall.width && (() => {
                const lEave = wall.leftEaveH || wall.height;
                const rEave = wall.rightEaveH || wall.height;
                const rX = wall.ridgeX || wall.width / 2;
                const lRise = wall.ridgeHeight - lEave;
                const rRise = wall.ridgeHeight - rEave;
                const lRun = rX;
                const rRun = wall.width - rX;
                const lPitch = lRun > 0 ? (lRise / lRun) * 12 : 0;
                const rPitch = rRun > 0 ? (rRise / rRun) * 12 : 0;
                const lAngle = lRun > 0 ? Math.atan(lRise / lRun) * (180 / Math.PI) : 90;
                const rAngle = rRun > 0 ? Math.atan(rRise / rRun) * (180 / Math.PI) : 90;
                const isAsymmetric = lEave !== rEave || rX !== wall.width / 2;
                return (
                  <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11, fontFamily: "monospace", color: colors.accent, lineHeight: 1.6 }}>
                    <div>
                      <div style={{ color: colors.textDim, fontWeight: 700, fontSize: 10 }}>LEFT SLOPE</div>
                      <div>Rise: {decToImperial(lRise).display}</div>
                      <div>Run: {decToImperial(lRun).display}</div>
                      <div>Pitch: {lPitch.toFixed(2)}/12</div>
                      <div>Angle: {lAngle.toFixed(2)}°</div>
                    </div>
                    <div>
                      <div style={{ color: colors.textDim, fontWeight: 700, fontSize: 10 }}>RIGHT SLOPE</div>
                      <div>Rise: {decToImperial(rRise).display}</div>
                      <div>Run: {decToImperial(rRun).display}</div>
                      <div>Pitch: {rPitch.toFixed(2)}/12</div>
                      <div>Angle: {rAngle.toFixed(2)}°</div>
                    </div>
                    {isAsymmetric && (
                      <div style={{ gridColumn: "1 / -1", color: colors.warn, fontSize: 10, fontWeight: 600 }}>
                        ⚠ Asymmetric gable — left and right slopes differ
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        {/* Openings */}
        <div>
          <Button onClick={() => setShowOpenings(!showOpenings)} variant="secondary" size="sm">
            {showOpenings ? "Hide" : "Show"} Openings ({wall.openings?.length || 0})
          </Button>
          {showOpenings && (
            <div style={{ marginTop: 12 }}>
              <OpeningEditor
                openings={wall.openings || []}
                onChange={(ops) => onUpdate({ openings: ops })}
                wallWidth={wall.width}
                wallHeight={wall.height}
              />
            </div>
          )}
        </div>
        {/* Layout Variations */}
        {wall.width && wall.height && variations.length > 0 && (
          <div>
            <label style={{ fontSize: 11, color: colors.textDim, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>
              Layout Variations (select one)
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {variations.map(v => (
                <div key={v.id} onClick={() => onUpdate({ selectedVariationId: v.id })}
                  style={{
                    background: (wall.selectedVariationId || variations[0]?.id) === v.id ? colors.accentGlow : colors.surfaceAlt,
                    border: `1px solid ${(wall.selectedVariationId || variations[0]?.id) === v.id ? colors.accent : colors.border}`,
                    borderRadius: 8, padding: "10px 14px", cursor: "pointer", transition: "all 0.2s",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{v.name}</div>
                      <div style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>{v.description}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: v.wasteInches === 0 ? colors.success : colors.warn, fontFamily: "monospace" }}>
                        {v.wastePercent.toFixed(1)}% waste
                      </div>
                      <div style={{ fontSize: 10, color: colors.textMuted }}>{v.totalPanels} panels</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Canvas Preview */}
        {selectedVar && computedPanels.length > 0 && (
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 16 }}>
            <LayoutCanvas
              panels={computedPanels}
              wallWidth={wall.width}
              wallHeight={wall.height}
              panelCutHeight={wall.panelCutHeight}
              openings={wall.openings || []}
              isGable={wall.isGable}
              ridgeHeight={wall.ridgeHeight}
              ridgeX={wall.ridgeX}
              leftEaveH={wall.leftEaveH}
              rightEaveH={wall.rightEaveH}
              leftPanelCutHeight={wall.leftPanelCutHeight}
              rightPanelCutHeight={wall.rightPanelCutHeight}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── PROFILE MANAGER ────────────────────────────────────────────────────────
function ProfileManager({ profiles, onChange }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const startEdit = (p) => { setEditing(p.id); setDraft({ ...p }); };
  const startNew = () => {
    const id = "custom-" + Date.now();
    setEditing(id);
    setDraft({ id, name: "New Profile", coverage: 36, overallWidth: 37.75, ribSpacing: 12, ribHeight: 1.25 });
  };
  const save = () => {
    if (!draft.name || !draft.coverage) return;
    const exists = profiles.find(p => p.id === draft.id);
    if (exists) onChange(profiles.map(p => p.id === draft.id ? draft : p));
    else onChange([...profiles, draft]);
    setEditing(null);
  };
  const remove = (id) => { onChange(profiles.filter(p => p.id !== id)); setEditing(null); };
  return (
    <Card title="Panel Profiles" headerRight={<Button onClick={startNew} size="sm" variant="secondary">+ Add Profile</Button>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {profiles.map(p => (
          <div key={p.id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: colors.surfaceAlt, borderRadius: 6, padding: "10px 14px", border: `1px solid ${colors.border}`,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{p.name}</div>
              <div style={{ fontSize: 11, color: colors.textDim }}>Coverage: {p.coverage}" · Overall: {p.overallWidth}" · Rib: {p.ribHeight}" @ {p.ribSpacing}" o.c.</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Button onClick={() => startEdit(p)} variant="ghost" size="sm">Edit</Button>
              <Button onClick={() => remove(p.id)} variant="danger" size="sm">×</Button>
            </div>
          </div>
        ))}
        {editing && (
          <div style={{ background: colors.bg, border: `1px solid ${colors.accent}`, borderRadius: 8, padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: colors.textDim, fontWeight: 600, textTransform: "uppercase" }}>Profile Name</label>
                <input value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  style={{ background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.text, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              </div>
              <MeasurementInput label="Coverage Width (in)" value={draft.coverage} onChange={(v) => setDraft({ ...draft, coverage: v })} compact />
              <MeasurementInput label="Overall Width (in)" value={draft.overallWidth} onChange={(v) => setDraft({ ...draft, overallWidth: v })} compact />
              <MeasurementInput label="Rib Spacing (in)" value={draft.ribSpacing} onChange={(v) => setDraft({ ...draft, ribSpacing: v })} compact />
              <MeasurementInput label="Rib Height (in)" value={draft.ribHeight} onChange={(v) => setDraft({ ...draft, ribHeight: v })} compact />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button onClick={() => setEditing(null)} variant="secondary" size="sm">Cancel</Button>
              <Button onClick={save} size="sm">Save Profile</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}


