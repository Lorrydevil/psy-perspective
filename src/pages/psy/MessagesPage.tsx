import type { Dispatch, SetStateAction } from "react";
import type { Exercise, MessageDraft, User, UserMessage } from "../../psy/types";

export default function MessagesPage({
  accounts,
  activeUser,
  formatDateTime,
  inboxMessagesCount,
  isClosed,
  messageDraft,
  messageFeedback,
  messageRecipients,
  onSendMessage,
  sentMessagesCount,
  setMessageDraft,
  sortedExercises,
  unreadMessagesCount,
  visibleMessages
}: {
  accounts: User[];
  activeUser: User;
  formatDateTime: (value: string) => string;
  inboxMessagesCount: number;
  isClosed: (exercise: Exercise) => boolean;
  messageDraft: MessageDraft;
  messageFeedback: string;
  messageRecipients: User[];
  onSendMessage: () => void;
  sentMessagesCount: number;
  setMessageDraft: Dispatch<SetStateAction<MessageDraft>>;
  sortedExercises: Exercise[];
  unreadMessagesCount: number;
  visibleMessages: UserMessage[];
}) {
  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">User Messages</span>
            <h2>Direct notes between creators and viewers</h2>
          </div>
          <p>Keep shared messages tied to an exercise or send a general note without exposing predictions publicly.</p>
        </div>

        <div className="detail-grid account-settings-grid">
          <div className="detail-card account-summary-card">
            <span>Inbox</span>
            <strong>{inboxMessagesCount} received</strong>
            <p>{unreadMessagesCount > 0 ? `${unreadMessagesCount} unread right now.` : "No unread messages."}</p>
          </div>
          <div className="detail-card account-summary-card">
            <span>Sent</span>
            <strong>{sentMessagesCount} sent</strong>
            <p>{messageFeedback}</p>
          </div>
        </div>

        <div className="form-grid form-grid-2 messages-layout">
          <div className="stack-list">
            <label className="field">
              <span>Recipient</span>
              <select
                onChange={(event) => {
                  setMessageDraft((current) => ({ ...current, recipientId: event.target.value }));
                }}
                value={messageDraft.recipientId}
              >
                <option value="">Select an account</option>
                {messageRecipients.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.role})
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Related exercise</span>
              <select
                onChange={(event) => {
                  setMessageDraft((current) => ({ ...current, exerciseId: event.target.value }));
                }}
                value={messageDraft.exerciseId}
              >
                <option value="">General note</option>
                {sortedExercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.title} ({isClosed(exercise) ? "Closed" : "Active"})
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Subject</span>
              <input
                onChange={(event) => {
                  setMessageDraft((current) => ({ ...current, subject: event.target.value }));
                }}
                placeholder="Optional short subject"
                value={messageDraft.subject}
              />
            </label>
            <label className="field">
              <span>Message</span>
              <textarea
                onChange={(event) => {
                  setMessageDraft((current) => ({ ...current, body: event.target.value }));
                }}
                placeholder="Ask a question, share a workflow note, or point someone to a reveal."
                value={messageDraft.body}
              />
            </label>
            <div className="action-row">
              <button
                className="button-primary"
                disabled={messageRecipients.length === 0}
                onClick={onSendMessage}
                type="button"
              >
                Send Message
              </button>
            </div>
          </div>

          <div className="stack-list">
            <div className="detail-card creator-status-card">
              <span>Message rules</span>
              <strong>Private to the addressed account</strong>
              <p>Messages are stored in the shared backend and shown only to the sender and recipient after sign-in.</p>
              <div className="status-list">
                <div className="status-row">
                  <strong>Selected exercise</strong>
                  <span>
                    {messageDraft.exerciseId
                      ? sortedExercises.find((exercise) => exercise.id === messageDraft.exerciseId)?.title ?? "Unavailable"
                      : "General note"}
                  </span>
                </div>
                <div className="status-row">
                  <strong>Recipient state</strong>
                  <span>{messageDraft.recipientId ? "Ready" : "Choose recipient"}</span>
                </div>
              </div>
            </div>
            {messageRecipients.length === 0 ? (
              <div className="empty-card">
                <strong>No other accounts available</strong>
                <p>Create or sign in to another account first to use the shared inbox.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Inbox</span>
            <h2>Saved shared conversation history</h2>
          </div>
          <p>Message history stays separated from the exercise feed so operational notes do not clutter the archive.</p>
        </div>

        <div className="stack-list">
          {visibleMessages.length > 0 ? (
            visibleMessages.map((message) => {
              const sender = accounts.find((account) => account.id === message.senderId);
              const recipient = accounts.find((account) => account.id === message.recipientId);
              const linkedExercise = message.exerciseId
                ? sortedExercises.find((exercise) => exercise.id === message.exerciseId)
                : null;
              const isIncoming = message.recipientId === activeUser.id;
              const isUnread = isIncoming && !message.readBy.includes(activeUser.id);

              return (
                <article className="submission-card message-card" key={message.id}>
                  <div className="exercise-top">
                    <div>
                      <span className="card-label">{isIncoming ? "Inbox" : "Sent"}</span>
                      <strong>{message.subject}</strong>
                    </div>
                    <span className={`badge ${isUnread ? "badge-warm" : "badge-muted"}`}>
                      {isUnread ? "Unread" : "Read"}
                    </span>
                  </div>
                  <div className="message-meta">
                    <span>{isIncoming ? `From ${sender?.name ?? "Unknown"}` : `To ${recipient?.name ?? "Unknown"}`}</span>
                    <span>{formatDateTime(message.createdAt)}</span>
                    <span>{linkedExercise ? linkedExercise.title : "General note"}</span>
                  </div>
                  <p className="message-body">{message.body}</p>
                </article>
              );
            })
          ) : (
            <div className="empty-card">
              <strong>No messages yet</strong>
              <p>Use this space for direct creator-viewer notes without posting them into the public archive.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
