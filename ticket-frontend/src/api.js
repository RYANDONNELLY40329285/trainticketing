const API = "http://localhost:3000";

let jwt = null;

export async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "demo",
      password: "demo",
    }),
  });

  const data = await res.json();
  jwt = data.accessToken;
}

export async function getRoutes() {
  const res = await fetch(`${API}/routes`);
  return res.json();
}

export async function createTicket(origin, destination) {
  const res = await fetch(`${API}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt}`,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      origin,
      destination,
      validDays: 1,
    }),
  });

  return res.json();
}



export async function scanTicket(ticketId, gateStation) {
  
  

  return fetch(`${API}/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": import.meta.env.VITE_GATE_API_KEY,
    },
    body: JSON.stringify({
      ticketId,
      gateOrigin: gateStation, 
    }),
  }).then(res => res.json());
}
