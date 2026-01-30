import { useEffect, useState } from "react";
import { login, getRoutes, createTicket, scanTicket } from "./api";
import { useTicketWallet } from "./useTicketWallet";
import "./App.css";

type Route = {
  origin: string;
  destinations: string[];
};

type GateResult = {
  gateAction: "OPEN" | "DENY";
  reason: string;
};

export default function App() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [gateResults, setGateResults] = useState<Record<string, GateResult>>({});
  const [showTicketPicker, setShowTicketPicker] = useState(false);

  const {
    wallet,
    activeTicket,
    activeTicketId,
    addTicket,
    selectTicket,
  } = useTicketWallet();

  const selectedRoute = routes.find(r => r.origin === origin);

  // ---------------- Init ----------------
  useEffect(() => {
    async function init() {
      await login();
      const data = await getRoutes();
      setRoutes(Array.isArray(data) ? data : data.routes ?? []);
    }
    init();
  }, []);

  // ---------------- Buy Ticket ----------------
  async function buyTicket() {
    const res = await createTicket(origin, destination);

    addTicket({
      ticketId: res.ticketId,
      origin,
      destination,
    });

    setGateResults({});
  }

  // ---------------- Scan Gate ----------------
  async function scanAtGate(gateDestination: string) {
    if (!activeTicket) return;

    if (activeTicket.destination !== gateDestination) {
      setGateResults(prev => ({
        ...prev,
        [gateDestination]: {
          gateAction: "DENY",
          reason: "WRONG_DESTINATION",
        },
      }));
      return;
    }


    const result = await scanTicket(
  activeTicket.ticketId,
  gateDestination
);

    setGateResults(prev => ({
      ...prev,
      [gateDestination]: result,
    }));
  }


return (
  <div className="app">
    <h1>Railway Ticket Simulator</h1>

    <div className="layout">
      {/* -------- Left Column (Intentional whitespace / future) -------- */}
      <div />

      {/* -------- Center Column (Primary actions) -------- */}
      <div>
        {/* -------- Buy Ticket -------- */}
        <div className="panel buy-panel">
          <h2>Buy Ticket</h2>

          <select value={origin} onChange={e => setOrigin(e.target.value)}>
            <option value="">Select origin</option>
            {routes.map(r => (
              <option key={r.origin} value={r.origin}>
                {r.origin}
              </option>
            ))}
          </select>

          <select
            value={destination}
            onChange={e => setDestination(e.target.value)}
            disabled={!selectedRoute}
          >
            <option value="">Select destination</option>
            {selectedRoute?.destinations.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button onClick={buyTicket} disabled={!origin || !destination}>
            Buy Ticket
          </button>
        </div>

        {/* -------- Active Ticket -------- */}
        {activeTicket && (
          <div className="panel">
            <h3>Active Ticket</h3>

            <div className="active-ticket">
              <strong>
                {activeTicket.origin} → {activeTicket.destination}
              </strong>
              <small>ID: {activeTicket.ticketId.slice(0, 8)}</small>
            </div>

            <button onClick={() => setShowTicketPicker(true)}>
              Change Ticket
            </button>
          </div>
        )}
      </div>

      {/* -------- Right Column (Operational / Gates) -------- */}
      {activeTicket && (
        <div className="panel gates-panel">
          <h2>Station Gates</h2>

          {routes.flatMap(r =>
            r.destinations.map(dest => {
              const result = gateResults[dest];
              const allowed = activeTicket.destination === dest;

              return (
                <div key={dest} className="gate-wrapper">
                  <h3>Gate → {dest}</h3>

                  <button
                    onClick={() => scanAtGate(dest)}
                    disabled={result?.reason === "ALREADY_USED"}
                  >
                    Scan Ticket
                  </button>

                  <div
                    className={`gate ${
                      result?.gateAction === "OPEN"
                        ? "open"
                        : result
                        ? "deny"
                        : ""
                    }`}
                  >
                    <div className="gate-door left" />
                    <div className="gate-door right" />
                  </div>

                  {!allowed && !result && (
                    <p className="blocked">Ticket not valid</p>
                  )}

                  {result && (
                    <p className="reason">
                      {result.gateAction} — {result.reason}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>

    {/* -------- Ticket Picker Modal -------- */}
    {showTicketPicker && (
      <div
        className="modal-overlay"
        onClick={() => setShowTicketPicker(false)}
      >
        <div className="modal" onClick={e => e.stopPropagation()}>
          <h2>Select Ticket</h2>

          {wallet.map(t => (
            <div
              key={t.ticketId}
              className={`modal-ticket ${
                t.ticketId === activeTicketId ? "selected" : ""
              }`}
              onClick={() => {
                selectTicket(t.ticketId);
                setGateResults({});
                setShowTicketPicker(false);
              }}
            >
              <strong>
                {t.origin} → {t.destination}
              </strong>
              <small>{t.ticketId}</small>
            </div>
          ))}

          <button
            className="close-btn"
            onClick={() => setShowTicketPicker(false)}
          >
            Close
          </button>
        </div>
      </div>
    )}
  </div>
);




}
