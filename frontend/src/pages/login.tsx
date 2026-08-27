import { useState } from "react";
import { graphqlRequest } from "../api/graphql";
import { LOGIN_MUTATION } from "../api/queries";
import type { User } from "../types/graphql";

interface LoginResponse {
  login: {
    token: string;
    user: User;
  };
}

interface LoginProps {
  onLogin: (user: User) => void;
}

export function Login({
  onLogin,
}: LoginProps) {
  const [email, setEmail] = useState(
    "reporter@example.com",
  );

  const [password, setPassword] =
    useState("Password123!");

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError(null);
    setLoading(true);

    try {
      const result =
        await graphqlRequest<LoginResponse>(
          LOGIN_MUTATION,
          {
            email,
            password,
          },
        );

      localStorage.setItem(
        "accessToken",
        result.login.token,
      );

      localStorage.setItem(
        "currentUser",
        JSON.stringify(
          result.login.user,
        ),
      );

      onLogin(result.login.user);
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Login failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form
        className="auth-card"
        onSubmit={handleSubmit}
      >
        <div className="brand-mark">
          ST
        </div>

        <h1>
          Support Ticket Tracker
        </h1>

        <p className="muted">
          Manage tickets, agents and SLA
          deadlines.
        </p>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />
        </label>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <button
          className="primary-button"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Signing in..."
            : "Sign in"}
        </button>

        <p className="login-hint">
          Demo: reporter@example.com /
          Password123!
        </p>
      </form>
    </main>
  );
}