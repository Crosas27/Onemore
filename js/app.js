// ─── MAIN APP ───────────────────────────────────────────────────────────────
function MetalPanelLayoutApp() {
  const [profiles, setProfiles] = useState(DEFAULT_PROFILES);
  const [walls, setWalls] = useState([]);
  const [projectName, setProjectName] = useState("New Project");
  const [activeTab, setActiveTab] = useState("layout");
  const [showExport, setShowExport] = useState(false);

  const addWall = () => {
    setWalls([...walls, {
      id: Date.now(),
      name: `Wall ${walls.length + 1}`,
      profileId: profiles[0]?.id || "pbr36",
      width: null,
      height: null,
      isGable: false,
      ridgeHeight: null,
      ridgeX: null,
      leftEaveH: null,
      rightEaveH: null,
      panelCutHeight: null,
      leftPanelCutHeight: null,
      rightPanelCutHeight: null,
      openings: [],
      selectedVariationId: null,
      selectedVariation: null,
      computedPanels: null,
      profileName: "",
      profileCoverage: 0,
    }]);
  };

  const updateWall = (id, updates) => {
    setWalls(ws => ws.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const removeWall = (id) => setWalls(ws => ws.filter(w => w.id !== id));

  const wallsWithData = walls.filter(w => w.selectedVariation && w.computedPanels);
  const exportText = useMemo(() => generateExportText(wallsWithData, projectName), [wallsWithData, projectName]);

  const copyExport = () => {
    navigator.clipboard.writeText(exportText).then(() => {
      setShowExport(true);
      setTimeout(() => setShowExport(false), 2000);
    });
  };

  return (
    <div style={{
      minHeight: "100vh", background: colors.bg, color: colors.text,
      fontFamily: "'Geist', 'SF Pro Display', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: colors.surface, borderBottom: `1px solid ${colors.border}`,
        padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDim})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff",
          }}>M</div>
          <div>
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)}
              style={{ background: "transparent", border: "none", color: colors.text, fontSize: 16, fontWeight: 700, outline: "none", fontFamily: "inherit", padding: 0, width: 200 }} />
            <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Metal Panel Layout Tool
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={copyExport} variant={showExport ? "success" : "secondary"} size="sm" disabled={wallsWithData.length === 0}>
            {showExport ? "Copied!" : "Copy Cut List"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
        <TabBar
          tabs={[
            { id: "layout", label: "Layout" },
            { id: "cutlist", label: `Cut List (${wallsWithData.length})` },
            { id: "profiles", label: "Profiles" },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        <div style={{ marginTop: 20, paddingBottom: 320 }}>
          {activeTab === "profiles" && (
            <ProfileManager profiles={profiles} onChange={setProfiles} />
          )}

          {activeTab === "layout" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {walls.map(wall => (
                <WallEditor
                  key={wall.id}
                  wall={wall}
                  profiles={profiles}
                  onUpdate={(updates) => updateWall(wall.id, updates)}
                  onRemove={() => removeWall(wall.id)}
                />
              ))}
              <Button onClick={addWall} variant="secondary" style={{ width: "100%", padding: "16px", justifyContent: "center" }}>
                + Add Wall
              </Button>
            </div>
          )}

          {activeTab === "cutlist" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {wallsWithData.length === 0 ? (
                <Card>
                  <div style={{ textAlign: "center", color: colors.textMuted, padding: 40, fontSize: 13 }}>
                    No walls configured yet. Add walls and select layouts to generate cut lists.
                  </div>
                </Card>
              ) : (
                <>
                  <CutListDisplay walls={wallsWithData} />
                  {/* Export preview */}
                  <Card title="Export Preview (Plain Text)" headerRight={
                    <Button onClick={copyExport} variant={showExport ? "success" : "primary"} size="sm">
                      {showExport ? "Copied!" : "Copy to Clipboard"}
                    </Button>
                  }>
                    <pre style={{
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 11, color: colors.textDim,
                      background: colors.bg, padding: 16, borderRadius: 8, overflow: "auto",
                      whiteSpace: "pre", lineHeight: 1.5, maxHeight: 400, border: `1px solid ${colors.border}`,
                    }}>{exportText}</pre>
                  </Card>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <NumpadOverlay />
    </div>
  );
}

// ─── MOUNT ──────────────────────────────────────────────────────────────────
const App = MetalPanelLayoutApp;
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
