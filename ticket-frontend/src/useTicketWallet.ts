import { useState } from "react";

export type Ticket = {
  ticketId: string;
  origin: string;
  destination: string;
};

export function useTicketWallet() {
  const [wallet, setWallet] = useState<Ticket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  const activeTicket =
    wallet.find(t => t.ticketId === activeTicketId) ?? null;

  function addTicket(ticket: Ticket) {
    setWallet(prev => [...prev, ticket]);
    setActiveTicketId(ticket.ticketId);
  }

  function selectTicket(ticketId: string) {
    setActiveTicketId(ticketId);
  }

  function resetWallet() {
    setWallet([]);
    setActiveTicketId(null);
  }

  return {
    wallet,
    activeTicket,
    activeTicketId,
    addTicket,
    selectTicket,
    resetWallet,
  };
}
