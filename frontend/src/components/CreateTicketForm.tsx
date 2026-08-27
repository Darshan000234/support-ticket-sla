import {
  useState,
} from "react";

import {
  graphqlRequest,
} from "../api/graphql";

import {
  CREATE_TICKET_MUTATION,
} from "../api/queries";

import type {
  Priority,
  Ticket,
} from "../types/graphql";

interface CreateTicketFormProps {
  onCreated: () => Promise<void>;
  onCancel: () => void;
}

interface CreateTicketResponse {
  createTicket: Ticket;
}

export function CreateTicketForm({
  onCreated,
  onCancel,
}: CreateTicketFormProps) {
  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [priority, setPriority] =
    useState<Priority>("MEDIUM");

  const [error, setError] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError(null);

    if (!title.trim()) {
      setError(
        "Title cannot be empty.",
      );

      return;
    }

    if (!description.trim()) {
      setError(
        "Description cannot be empty.",
      );

      return;
    }

    setSaving(true);

    try {
      await graphqlRequest<CreateTicketResponse>(
        CREATE_TICKET_MUTATION,
        {
          title,
          description,
          priority,
        },
      );

      await onCreated();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create ticket",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-card">
        <div className="modal-header">
          <div>
            <h2>Create ticket</h2>
            <p className="muted">
              New tickets start in OPEN
              status.
            </p>
          </div>

          <button
            className="icon-button"
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <form
          className="form-stack"
          onSubmit={handleSubmit}
        >
          <label>
            Title
            <input
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value,
                )
              }
              placeholder="Payment failed"
              maxLength={200}
              required
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="Describe the problem..."
              rows={6}
              required
            />
          </label>

          <label>
            Priority
            <select
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target.value as Priority,
                )
              }
            >
              <option value="LOW">
                LOW
              </option>

              <option value="MEDIUM">
                MEDIUM
              </option>

              <option value="HIGH">
                HIGH
              </option>

              <option value="URGENT">
                URGENT
              </option>
            </select>
          </label>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onCancel}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "Creating..."
                : "Create ticket"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}