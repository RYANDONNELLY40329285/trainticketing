import { useEffect, useState } from "react";
import { login, getRoutes, createTicket, scanTicket } from "./api";
import "./App.css";

type Route = {
  origin: string;
  destinations: string[];
};

export default function App() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [gateResult, setGateResult] = useState<any>(null);

  const selectedRoute = routes.find(r => r.origin === origin);

  useEffect(() => {
    async function init() {
      await login();
      const data = await getRoutes();

      // SAFETY: always force array
      setRoutes(Array.isArray(data) ? data : data?.routes ?? []);
    }

    init();
  }, []);

  async function buyTicket() {
    const ticket = await createTicket(origin, destination);
    setTicketId(ticket.ticketId);
    setGateResult(null);
  }

  async function scan() {
    if (!ticketId) return;
    const result = await scanTicket(ticketId, origin);
    setGateResult(result);
  }

  return (
    <div className="app">
      <h1>🚆 Railway Ticket Simulator</h1>

      {/* BUY TICKET */}
      <div className="panel">
        <h2>Buy Ticket</h2>

        <select
          value={origin}
          onChange={(e) => {
            setOrigin(e.target.value);
            setDestination("");
          }}
        >
          <option value="">Select origin</option>
          {routes.map(r => (
            <option key={r.origin} value={r.origin}>
              {r.origin}
            </option>
          ))}
        </select>

        <select
          value={destination}
          disabled={!selectedRoute}
          onChange={(e) => setDestination(e.target.value)}
        >
          <option value="">Select destination</option>
          {selectedRoute?.destinations?.map(d => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <button
          onClick={buyTicket}
          disabled={!origin || !destination}
        >
          🎟 Buy Ticket
        </button>

        {ticketId && <p>Ticket ID: {ticketId}</p>}
      </div>

      {/* GATE SCAN (ONLY AFTER TICKET EXISTS) */}
      {ticketId && (
        <div className="panel">
          <h2>Gate Scan</h2>

          <button
            onClick={scan}
            disabled={gateResult?.reason === "ALREADY_USED"}
          >
            🚪 Scan Ticket
          </button>

          <div
            className={`gate ${
              gateResult?.gateAction === "OPEN"
                ? "open"
                : gateResult
                ? "deny"
                : ""
            }`}
          >
            <div className="gate-door left" />
            <div className="gate-door right" />
          </div>

          {gateResult && (
            <p className="reason">
              {gateResult.gateAction} — {gateResult.reason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
