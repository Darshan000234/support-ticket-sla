import {
  useState,
} from "react";

import {
  Login,
} from "./pages/login";

import {
  Dashboard,
} from "./pages/Dashboard";

import type {
  User,
} from "./types/graphql";

function loadStoredUser(): User | null {
  const stored =
    localStorage.getItem(
      "currentUser",
    );

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(
      stored,
    ) as User;
  } catch {
    localStorage.removeItem(
      "currentUser",
    );

    localStorage.removeItem(
      "accessToken",
    );

    return null;
  }
}

function App() {
  const [user, setUser] =
    useState<User | null>(
      loadStoredUser,
    );

  function handleLogout(): void {
    localStorage.removeItem(
      "accessToken",
    );

    localStorage.removeItem(
      "currentUser",
    );

    setUser(null);
  }

  if (!user) {
    return (
      <Login
        onLogin={setUser}
      />
    );
  }

  return (
    <Dashboard
      currentUser={user}
      onLogout={handleLogout}
    />
  );
}

export default App;