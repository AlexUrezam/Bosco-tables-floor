import React, { useEffect, useMemo, useState } from "react";

// Tables from your layout
const TABLES = [
  10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33, 40, 41, 42, 43, 50, 51, 60,
  61, 70,
];

// Percent positions (Option A) for bosco-floor-plan.png
// left/top are in % relative to the image container
const TABLE_POS = {
  33: { left: 12.2, top: 25.73 },
  32: { left: 12.42, top: 40.01 },
  31: { left: 11.99, top: 54.1 },
  30: { left: 12.6, top: 68 },

  13: { left: 29.36, top: 25.73 },
  12: { left: 29.36, top: 35.21 },
  11: { left: 29.47, top: 44.04 },
  10: { left: 29.57, top: 53.71 },

  23: { left: 72.84, top: 26.12 },
  22: { left: 72.84, top: 35.6 },
  21: { left: 72.84, top: 44.43 },
  20: { left: 72.95, top: 54.1 },

  43: { left: 87.34, top: 26.83 },
  42: { left: 87.55, top: 41.05 },
  41: { left: 87.12, top: 55.14 },

  50: { left: 41, top: 64.6 },
  51: { left: 61.8, top: 64.6 },

  60: { left: 41.54, top: 77.12 },
  61: { left: 63, top: 76.95 },

  40: { left: 85.2, top: 68.4 },
  70: { left: 87.76, top: 90.27 },
};

const emptyRSV = (table) => ({
  table,
  name: "",
  partySize: "",
  rp: "",
  notes: "",
  status: "", // type: "confirmada" for green
  guestsText: "", // comma-separated guests for that table ONLY
});

export default function App() {
  const [view, setView] = useState("map"); // map | list
  const [selectedTable, setSelectedTable] = useState(null);
  const [showPodium, setShowPodium] = useState(false);

  // ✅ Tabs for days (separate saved data per tab)
  const [day, setDay] = useState("Thu"); // Thu | Fri | Sat
  const storageKey = `bosco:v1:${day}`;

  // Table reservations keyed by table number
  const [reservations, setReservations] = useState({});

  // ✅ Separate guest list (NOT connected to table RSV)
  const [guestList, setGuestList] = useState([]);
  const [newGuest, setNewGuest] = useState("");

  // ---- LOAD saved data when day changes (or first load)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setReservations({});
        setGuestList([]);
        return;
      }
      const data = JSON.parse(raw);
      setReservations(data?.reservations || {});
      setGuestList(data?.guestList || []);
    } catch (e) {
      console.log("Load failed:", e);
      setReservations({});
      setGuestList([]);
    }
  }, [storageKey]);

  // ---- AUTO-SAVE whenever reservations/guestList changes
  useEffect(() => {
    try {
      const payload = {
        reservations,
        guestList,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.log("Save failed:", e);
    }
  }, [storageKey, reservations, guestList]);

  const current = useMemo(() => {
    if (!selectedTable) return null;
    return reservations[selectedTable] || emptyRSV(selectedTable);
  }, [reservations, selectedTable]);

  function setField(field, value) {
    setReservations((prev) => ({
      ...prev,
      [selectedTable]: {
        ...(prev[selectedTable] || emptyRSV(selectedTable)),
        [field]: value,
      },
    }));
  }

  function tableFill(table) {
    const r = reservations[table];
    if (!r) return "white";

    const hasAny =
      (r.name || "").trim() ||
      (r.partySize || "").trim() ||
      (r.rp || "").trim() ||
      (r.notes || "").trim() ||
      (r.status || "").trim() ||
      (r.guestsText || "").trim();

    if (!hasAny) return "white";
    if ((r.status || "").toLowerCase() === "confirmada") return "#34d399"; // green
    return "#fde047"; // yellow
  }

  function clearTable(table) {
    setReservations((prev) => {
      const copy = { ...prev };
      delete copy[table];
      return copy;
    });
  }

  function addGuestBlock() {
    const block = newGuest.trim();
    if (!block) return;

    // split by newline OR comma
    const names = block
      .split(/[\n,]/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (names.length === 0) return;

    setGuestList((prev) => [...prev, ...names]);
    setNewGuest("");
  }

  function clearDayData() {
    const ok = window.confirm(`Clear ALL saved data for ${day}?`);
    if (!ok) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setReservations({});
    setGuestList([]);
    setSelectedTable(null);
    setShowPodium(false);
  }

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
        padding: 16,
      }}
    >
      {/* Title + Day Tabs (adjacent) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0 }}>Bosco Tables Demo</h2>

        <div style={{ display: "flex", gap: 8 }}>
          {["Jueves", "Viernes", "Sabado"].map((d) => {
            const active = day === d;
            return (
              <button
                key={d}
                onClick={() => setDay(d)}
                style={{
                  ...btn,
                  background: active ? "#d11" : "#fff",
                  color: active ? "#fff" : "#111",
                }}
                title={`Switch to ${d}`}
              >
                {d}
              </button>
            );
          })}

          <button onClick={clearDayData} style={btn} title="Clear this day">
            Clear
          </button>
        </div>
      </div>

      <p style={{ marginTop: 6, color: "#555" }}></p>

      {/* MAP VIEW */}
      {view === "map" && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setView("list")} style={btn}>
            ▶ Table RSV (list)
          </button>

          <button
            onClick={() => setShowPodium(true)}
            style={{ ...btn, marginLeft: 8 }}
          >
            Podium (Guest List)
          </button>

          <div style={{ marginTop: 16 }}>
            <div
              style={{
                position: "relative",
                width: "min(900px, 100%)",
                margin: "0 auto",
              }}
            >
              <img
                src="/bosco-floor-plan.png"
                alt="Bosco floor plan"
                style={{ width: "100%", height: "auto", display: "block" }}
              />

              {TABLES.map((t) => {
                const p = TABLE_POS[t];
                if (!p) return null;

                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTable(t)}
                    style={{
                      position: "absolute",
                      left: `${p.left}%`,
                      top: `${p.top}%`,
                      transform: "translate(-50%, -50%)",
                      width: 56,
                      height: 56,
                      borderRadius: 999,
                      border: "2px solid #d11",
                      background: tableFill(t),
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 900,
                    }}
                    title={`Table ${t}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setView("map")} style={btn}>
            ◀ Back to map
          </button>

          <h3 style={{ marginTop: 14, marginBottom: 8, color: "#b00" }}>
            Table RSV
          </h3>

          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              overflow: "hidden",
              maxWidth: 460,
            }}
          >
            {TABLES.map((t) => (
              <div
                key={t}
                onClick={() => setSelectedTable(t)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderBottom: "1px solid #f0f0f0",
                  cursor: "pointer",
                  background: "#fff",
                }}
              >
                <span style={{ fontWeight: 900, color: "#b00" }}>{t}</span>
                <span style={{ color: "#111" }}>
                  {reservations[t]?.name || ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABLE POPUP */}
      {selectedTable && (
        <div style={overlay} onClick={() => setSelectedTable(null)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, color: "#b00" }}>
                Table {selectedTable}
              </h3>
              <button onClick={() => setSelectedTable(null)} style={xbtn}>
                ✕
              </button>
            </div>

            <div style={formRow}>
              <label style={label}>Name</label>
              <input
                style={input}
                value={current.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>

            <div style={formRow}>
              <label style={label}>Party size</label>
              <input
                style={input}
                value={current.partySize}
                onChange={(e) => setField("partySize", e.target.value)}
              />
            </div>

            <div style={formRow}>
              <label style={label}>RP</label>
              <input
                style={input}
                value={current.rp}
                onChange={(e) => setField("rp", e.target.value)}
              />
            </div>

            <div style={formRow}>
              <label style={label}>Notes</label>
              <input
                style={input}
                value={current.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </div>

            <div style={formRow}>
              <label style={label}>Status</label>

              <select
                style={input}
                value={current.status || ""}
                onChange={(e) => setField("status", e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <option value="confirmada">Confirmada</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>

            <div style={formRow}>
              <label style={label}>Guests (table only)</label>
              <input
                style={input}
                placeholder="Comma separated: Alex, Mateo, Beto"
                value={current.guestsText}
                onChange={(e) => setField("guestsText", e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button style={btn} onClick={() => clearTable(selectedTable)}>
                Clear table
              </button>
              <button style={btn} onClick={() => setSelectedTable(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PODIUM POPUP (separate guest list) */}
      {showPodium && (
        <div style={overlay} onClick={() => setShowPodium(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, _ATTACH: ">>" }}></h3>
              {/* small trick: prevents accidental formatting changes */}
              <h3 style={{ margin: 0, color: "#b00" }}>Guest List</h3>
              <button onClick={() => setShowPodium(false)} style={xbtn}>
                ✕
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
              <input
                style={{ ...input, flex: 1 }}
                placeholder="Add guest name(s) — use comma or new lines"
                value={newGuest}
                onChange={(e) => setNewGuest(e.target.value)}
                onKeyDown={(e) => {
                  // Enter adds; Shift+Enter creates a new line
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addGuestBlock();
                  }
                }}
              />
              <button style={btn} onClick={addGuestBlock}>
                Add
              </button>
            </div>

            <div
              style={{
                maxHeight: 360,
                overflow: "auto",
                border: "1px solid #eee",
                borderRadius: 12,
              }}
            >
              {guestList.length === 0 ? (
                <div style={{ padding: 12, color: "#666" }}>
                  No guest list names yet.
                </div>
              ) : (
                guestList.map((name, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid #f3f3f3",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    {name}
                    <button
                      onClick={() =>
                        setGuestList((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                      title="Remove"
                    >
                      ❌
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <button style={btn} onClick={() => setShowPodium(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====== Styles ======
const btn = {
  background: "#fff",
  border: "2px solid #d11",
  borderRadius: 12,
  padding: "8px 12px",
  fontWeight: 800,
  cursor: "pointer",
};

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 50,
};

const modal = {
  width: "min(520px, 95vw)",
  background: "#fff",
  borderRadius: 16,
  padding: 14,
  border: "2px solid #d11",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
};

const xbtn = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 10,
  padding: "6px 10px",
  cursor: "pointer",
  fontWeight: 900,
};

const formRow = { marginTop: 10 };
const label = {
  display: "block",
  fontSize: 13,
  fontWeight: 900,
  color: "#b00",
  marginBottom: 4,
};
const input = {
  width: "100%",
  padding: "10px 10px",
  borderRadius: 12,
  border: "1px solid #ddd",
  fontSize: 14,
};
