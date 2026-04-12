// ─── MATH ENGINE: Panel Layout Calculations ─────────────────────────────────
function generateLayoutVariations(wallWidth, panelCoverage, minPartialWidth = 6) {
  const variations = [];
  const fullCount = Math.floor(wallWidth / panelCoverage);
  // Max partial panels allowed to iterate down
  const maxDropCentered = 3;
  const maxDropFlush = 2;

  // Method 1: Centered — equal partials both sides
  for (let fc = fullCount; fc >= Math.max(fullCount - maxDropCentered, 1); fc--) {
    const remainder = wallWidth - fc * panelCoverage;
    if (remainder < 0) continue;
    const partial = remainder / 2;
    // STRICT: partial must be >= 6" and CANNOT exceed panel coverage width
    if (remainder === 0) {
      // Perfect fit
      const panels = [];
      for (let i = 0; i < fc; i++) panels.push({ width: panelCoverage, position: "full", index: i + 1 });
      variations.push({
        id: `centered-${fc}`, name: `Centered · ${fc} full · no cuts`,
        description: "Perfect fit — no partial panels needed", method: "centered",
        panels, fullPanels: fc, partialWidth: 0, totalPanels: fc, sheetsNeeded: fc,
        wasteInches: 0, wastePercent: 0,
      });
    } else if (partial >= minPartialWidth && partial <= panelCoverage) {
      const panels = [];
      panels.push({ width: partial, position: "left-partial", index: 1 });
      for (let i = 0; i < fc; i++) panels.push({ width: panelCoverage, position: "full", index: panels.length + 1 });
      panels.push({ width: partial, position: "right-partial", index: panels.length + 1 });
      const waste = (panelCoverage - partial) * 2;
      variations.push({
        id: `centered-${fc}`,
        name: `Centered · ${fc} full + 2 partials`,
        description: `Equal ${decToImperial(partial).display} partials on each side`,
        method: "centered", panels, fullPanels: fc, partialWidth: partial,
        totalPanels: panels.length, sheetsNeeded: panels.length,
        wasteInches: waste,
        wastePercent: (waste / (panels.length * panelCoverage)) * 100,
      });
    }
    // else: partial is too narrow or too wide — skip this fc count
  }

  // Method 2: Left-flush — full panels from left, one cut on right
  for (let fc = fullCount; fc >= Math.max(fullCount - maxDropFlush, 1); fc--) {
    const remainder = wallWidth - fc * panelCoverage;
    // STRICT: remainder must be a valid partial width
    if (remainder > 0 && remainder >= minPartialWidth && remainder <= panelCoverage) {
      const panels = [];
      for (let i = 0; i < fc; i++) panels.push({ width: panelCoverage, position: "full", index: panels.length + 1 });
      panels.push({ width: remainder, position: "right-partial", index: panels.length + 1 });
      variations.push({
        id: `left-flush-${fc}`,
        name: `Left flush · ${fc} full + 1 cut right`,
        description: `Full panels from left, ${decToImperial(remainder).display} cut panel on right`,
        method: "left-flush", panels, fullPanels: fc, partialWidth: remainder,
        totalPanels: panels.length, sheetsNeeded: panels.length,
        wasteInches: panelCoverage - remainder,
        wastePercent: ((panelCoverage - remainder) / (panels.length * panelCoverage)) * 100,
      });
    }
  }

  // Method 3: Right-flush — cut on left, full panels to right
  for (let fc = fullCount; fc >= Math.max(fullCount - maxDropFlush, 1); fc--) {
    const remainder = wallWidth - fc * panelCoverage;
    if (remainder > 0 && remainder >= minPartialWidth && remainder <= panelCoverage) {
      const panels = [];
      panels.push({ width: remainder, position: "left-partial", index: 1 });
      for (let i = 0; i < fc; i++) panels.push({ width: panelCoverage, position: "full", index: panels.length + 1 });
      variations.push({
        id: `right-flush-${fc}`,
        name: `Right flush · 1 cut left + ${fc} full`,
        description: `${decToImperial(remainder).display} cut panel on left, full panels to right`,
        method: "right-flush", panels, fullPanels: fc, partialWidth: remainder,
        totalPanels: panels.length, sheetsNeeded: panels.length,
        wasteInches: panelCoverage - remainder,
        wastePercent: ((panelCoverage - remainder) / (panels.length * panelCoverage)) * 100,
      });
    }
  }

  // Sort: centered first, then by least waste
  variations.sort((a, b) => {
    if (a.method === "centered" && b.method !== "centered") return -1;
    if (b.method === "centered" && a.method !== "centered") return 1;
    return a.wasteInches - b.wasteInches;
  });
  return variations.slice(0, 5);
}

// ─── ASYMMETRIC GABLE END WALL ENGINE ───────────────────────────────────────
//
// Geometry:
//   Left eave height  (leftEaveH)  — structural eave on the left side
//   Right eave height (rightEaveH) — structural eave on the right side
//   Ridge height      (ridgeH)     — peak of the gable
//   Ridge X offset    (ridgeX)     — horizontal distance from left wall edge to ridge
//   Left panel cut height  (leftPCH)  — actual panel termination on left side
//   Right panel cut height (rightPCH) — actual panel termination on right side
//
// The roof forms two independent slopes:
//   Left slope:  from (0, leftEaveH) to (ridgeX, ridgeH)
//   Right slope: from (ridgeX, ridgeH) to (wallWidth, rightEaveH)
//
// For symmetric gables: leftEaveH == rightEaveH, ridgeX == wallWidth/2
//
function computeGableAngleCuts(wallWidth, gable, panelCoverage, layoutPanels) {
  const { leftEaveH, rightEaveH, ridgeH, ridgeX, leftPCH, rightPCH } = gable;
  if (!ridgeH || (ridgeH <= leftEaveH && ridgeH <= rightEaveH)) {
    // No gable — flat wall. Use the side-appropriate panel cut height.
    return layoutPanels.map((p, idx) => {
      let px = 0; for (let i = 0; i < idx; i++) px += layoutPanels[i].width;
      const pch = (px + p.width / 2) <= ridgeX ? leftPCH : rightPCH;
      return { ...p, gableCut: null, panelLength: pch };
    });
  }

  // Left slope geometry
  const leftRise = ridgeH - leftEaveH;
  const leftRun = ridgeX;
  const leftPitch = leftRun > 0 ? leftRise / leftRun : 0;
  const leftAngle = leftRun > 0 ? Math.atan(leftPitch) * (180 / Math.PI) : 90;
  const leftEaveOffset = leftEaveH - leftPCH;

  // Right slope geometry
  const rightRise = ridgeH - rightEaveH;
  const rightRun = wallWidth - ridgeX;
  const rightPitch = rightRun > 0 ? rightRise / rightRun : 0;
  const rightAngle = rightRun > 0 ? Math.atan(rightPitch) * (180 / Math.PI) : 90;
  const rightEaveOffset = rightEaveH - rightPCH;

  return layoutPanels.map((panel, idx) => {
    let panelLeftX = 0;
    for (let i = 0; i < idx; i++) panelLeftX += layoutPanels[i].width;
    const panelRightX = panelLeftX + panel.width;
    const panelCenterX = panelLeftX + panel.width / 2;

    // Structural height at any X position along the two slopes
    const structH = (x) => {
      if (x <= ridgeX) {
        return leftRun > 0 ? leftEaveH + leftRise * (x / leftRun) : ridgeH;
      } else {
        return rightRun > 0 ? rightEaveH + rightRise * ((wallWidth - x) / rightRun) : ridgeH;
      }
    };

    const structLeftH = structH(panelLeftX);
    const structRightH = structH(panelRightX);

    // Determine which side this panel is on for eave offset & panel cut height
    const onLeftSide = panelCenterX <= ridgeX;
    const localEaveH = onLeftSide ? leftEaveH : rightEaveH;
    const localPCH = onLeftSide ? leftPCH : rightPCH;
    const localEaveOffset = localEaveH - localPCH;
    const localAngle = onLeftSide ? leftAngle : rightAngle;

    // Panel that straddles the ridge: use peak at ridgeX
    const straddlesRidge = panelLeftX < ridgeX && panelRightX > ridgeX;

    // Actual panel cut heights (applying eave offset)
    const leftCutH = structLeftH - (panelLeftX <= ridgeX ? leftEaveOffset : rightEaveOffset);
    const rightCutH = structRightH - (panelRightX <= ridgeX ? leftEaveOffset : rightEaveOffset);

    // Is any part of this panel above its local eave line?
    const isAboveEave = structLeftH > localEaveH || structRightH > localEaveH || straddlesRidge;

    if (!isAboveEave) {
      return { ...panel, panelLength: localPCH, gableCut: null };
    }

    const actualLeftH = Math.round(leftCutH * 8) / 8;
    const actualRightH = Math.round(rightCutH * 8) / 8;
    const maxH = straddlesRidge
      ? Math.round((ridgeH - Math.min(leftEaveOffset, rightEaveOffset)) * 8) / 8
      : Math.max(actualLeftH, actualRightH);

    // For panels straddling the ridge, note both angles
    const slopeSide = straddlesRidge ? "ridge" : (onLeftSide ? "left" : "right");
    const angle = straddlesRidge
      ? Math.round(Math.max(leftAngle, rightAngle) * 100) / 100
      : Math.round(localAngle * 100) / 100;

    return {
      ...panel,
      panelLength: maxH,
      gableCut: {
        leftHeight: actualLeftH,
        rightHeight: actualRightH,
        angle: angle,
        side: slopeSide,
        cutDelta: Math.round(Math.abs(actualLeftH - actualRightH) * 8) / 8,
        straddlesRidge: straddlesRidge,
        leftAngle: straddlesRidge ? Math.round(leftAngle * 100) / 100 : undefined,
        rightAngle: straddlesRidge ? Math.round(rightAngle * 100) / 100 : undefined,
      },
    };
  });
}

function computeOpeningCuts(panels, openings, wallHeight) {
  if (!openings || openings.length === 0) return panels.map(p => ({ ...p, cuts: [], hasOpening: false }));
  return panels.map((panel, idx) => {
    let panelLeftX = 0;
    for (let i = 0; i < idx; i++) panelLeftX += panels[i].width;
    const panelRightX = panelLeftX + panel.width;
    const intersecting = openings.filter(op => {
      const opRight = op.fromLeft + op.width;
      return opRight > panelLeftX && op.fromLeft < panelRightX;
    });
    if (intersecting.length === 0) return { ...panel, cuts: [], hasOpening: false };
    const cuts = intersecting.map(op => {
      const opRight = op.fromLeft + op.width;
      const cutLeft = Math.max(0, op.fromLeft - panelLeftX);
      const cutRight = Math.min(panel.width, opRight - panelLeftX);
      return {
        type: op.type || "window",
        label: op.label || "Opening",
        cutFromLeft: Math.round(cutLeft * 8) / 8,
        cutWidth: Math.round((cutRight - cutLeft) * 8) / 8,
        cutFromBottom: op.fromBottom,
        cutHeight: op.height,
        fullWidth: cutLeft <= 0.5 && (panel.width - cutRight) <= 0.5,
      };
    });
    return { ...panel, cuts, hasOpening: true };
  });
}

// ─── SHARED: Per-panel row data used by both display and export ─────────────
function buildPanelRow(p, wall) {
  const isCut = p.position !== "full";
  const hasGable = !!p.gableCut;
  const lH = hasGable ? p.gableCut.leftHeight : (p.panelLength || wall.panelCutHeight || wall.height);
  const rH = hasGable ? p.gableCut.rightHeight : lH;
  const isAngle = hasGable && lH !== rH;
  const notes = [];
  if (isCut) notes.push(`CUT W: ${decToImperial(p.width).display}`);
  if (hasGable && p.gableCut.straddlesRidge) {
    notes.push(`RIDGE · L ${p.gableCut.leftAngle}° · R ${p.gableCut.rightAngle}°`);
  } else if (isAngle) {
    notes.push(`${p.gableCut.angle}° ${p.gableCut.side} slope`);
  }
  if (p.hasOpening && p.cuts) {
    p.cuts.forEach(c => notes.push(`Notch: ${c.label}`));
  }
  if (!isCut && !isAngle && notes.length === 0) notes.push("full panel");
  return {
    num: String(p.index).padStart(2, "0"),
    lH,
    rH,
    lDisplay: decToImperial(lH).display,
    lTotal: `${Math.round(lH * 8) / 8}"`,
    rDisplay: decToImperial(rH).display,
    rTotal: `${Math.round(rH * 8) / 8}"`,
    arrow: isAngle ? "→" : "—",
    isAngle,
    isCut,
    notes: notes.join(" · "),
  };
}

