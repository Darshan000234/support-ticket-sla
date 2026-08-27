import {
  useState,
} from "react";

import {
  graphqlRequest,
} from "../api/graphql";

import {
  ADD_COMMENT_MUTATION,
} from "../api/queries";

import type {
  Comment,
} from "../types/graphql";

interface CommentThreadProps {
  ticketId: string;
  comments: Comment[];
  onCommentAdded: () => Promise<void>;
}

interface AddCommentResponse {
  addComment: Comment;
}

export function CommentThread({
  ticketId,
  comments,
  onCommentAdded,
}: CommentThreadProps) {
  const [content, setContent] =
    useState("");

  const [error, setError] =
    useState<string | null>(null);

  const [sending, setSending] =
    useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!content.trim()) {
      setError(
        "Comment cannot be empty.",
      );

      return;
    }

    setSending(true);
    setError(null);

    try {
      await graphqlRequest<AddCommentResponse>(
        ADD_COMMENT_MUTATION,
        {
          ticketId,
          content,
        },
      );

      setContent("");

      await onCommentAdded();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to add comment",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="comments-section">
      <div className="section-heading">
        <h3>Comments</h3>
        <span>
          {comments.length}
        </span>
      </div>

      <div className="comments-list">
        {comments.length === 0 && (
          <p className="muted">
            No comments yet.
          </p>
        )}

        {comments.map((comment) => (
          <article
            key={comment.id}
            className="comment"
          >
            <div className="comment-header">
              <strong>
                {comment.author.name}
              </strong>

              <span className="comment-role">
                {comment.author.role}
              </span>

              <time>
                {new Date(
                  comment.createdAt,
                ).toLocaleString()}
              </time>
            </div>

            <p>{comment.content}</p>
          </article>
        ))}
      </div>

      <form
        className="comment-form"
        onSubmit={handleSubmit}
      >
        <textarea
          placeholder="Write a comment..."
          value={content}
          onChange={(event) =>
            setContent(
              event.target.value,
            )
          }
          rows={4}
        />

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <button
          className="primary-button"
          type="submit"
          disabled={sending}
        >
          {sending
            ? "Sending..."
            : "Add comment"}
        </button>
      </form>
    </section>
  );
}