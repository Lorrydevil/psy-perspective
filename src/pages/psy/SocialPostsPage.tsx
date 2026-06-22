import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Link } from "react-router-dom";
import type {
  Exercise,
  SocialPost,
  SocialPostDraft,
  SocialPostInteraction,
  SocialReactionKey,
  User
} from "../../psy/types";
import { getRoleLabel, isCreatorRole } from "../../psy/types";

export default function SocialPostsPage({
  accounts,
  activeExercises,
  activeUser,
  closedExercises,
  commentDrafts,
  formatDateTime,
  isPublishingSocialPost,
  onAddComment,
  onPublishPost,
  onToggleReaction,
  postingCommentIds,
  setCommentDrafts,
  setSocialDraft,
  socialDraft,
  socialFeedback,
  socialInteractions,
  socialPosts,
  sortedExercises
}: {
  accounts: User[];
  activeExercises: Exercise[];
  activeUser: User;
  closedExercises: Exercise[];
  commentDrafts: Record<string, string>;
  formatDateTime: (value: string) => string;
  isPublishingSocialPost: boolean;
  onAddComment: (postId: string) => void | Promise<void>;
  onPublishPost: () => void | Promise<void>;
  onToggleReaction: (postId: string, reaction: SocialReactionKey) => void | Promise<void>;
  postingCommentIds: string[];
  setCommentDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  setSocialDraft: Dispatch<SetStateAction<SocialPostDraft>>;
  socialDraft: SocialPostDraft;
  socialFeedback: string;
  socialInteractions: Record<string, SocialPostInteraction>;
  socialPosts: SocialPost[];
  sortedExercises: Exercise[];
}) {
  const [feedFilter, setFeedFilter] = useState<"all" | "blind_safe" | "reveals" | "community">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const canPublishPosts = isCreatorRole(activeUser.role);
  const reactionOptions: Array<{ key: SocialReactionKey; label: string }> = [
    { key: "resonates", label: "Resonates" },
    { key: "curious", label: "Curious" },
    { key: "sharp", label: "Sharp hit" }
  ];
  const allExercises = useMemo(() => activeExercises.concat(closedExercises), [activeExercises, closedExercises]);
  const totalReactions = useMemo(
    () =>
      Object.values(socialInteractions).reduce(
        (total, interaction) =>
          total +
          interaction.reactions.resonates.length +
          interaction.reactions.curious.length +
          interaction.reactions.sharp.length,
        0
      ),
    [socialInteractions]
  );
  const totalComments = useMemo(
    () => Object.values(socialInteractions).reduce((total, interaction) => total + interaction.comments.length, 0),
    [socialInteractions]
  );
  const userCommentCount = useMemo(
    () =>
      Object.values(socialInteractions).reduce(
        (total, interaction) => total + interaction.comments.filter((comment) => comment.authorId === activeUser.id).length,
        0
      ),
    [activeUser.id, socialInteractions]
  );
  const userReactionCount = useMemo(
    () =>
      Object.values(socialInteractions).reduce((total, interaction) => {
        return (
          total +
          (interaction.reactions.resonates.includes(activeUser.id) ? 1 : 0) +
          (interaction.reactions.curious.includes(activeUser.id) ? 1 : 0) +
          (interaction.reactions.sharp.includes(activeUser.id) ? 1 : 0)
        );
      }, 0),
    [activeUser.id, socialInteractions]
  );
  const userPredictionCount = useMemo(
    () =>
      sortedExercises.reduce(
        (total, exercise) => total + exercise.predictions.filter((prediction) => prediction.userId === activeUser.id).length,
        0
      ),
    [activeUser.id, sortedExercises]
  );
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visiblePosts = useMemo(() => {
    return socialPosts.filter((post) => {
      const linkedExercise = post.exerciseId ? allExercises.find((exercise) => exercise.id === post.exerciseId) : null;
      const matchesFilter =
        feedFilter === "all"
          ? true
          : feedFilter === "blind_safe"
            ? post.audience === "Blind-safe"
            : feedFilter === "reveals"
              ? post.kind === "reveal" || post.audience === "Public archive"
              : post.kind === "system" || post.kind === "viewer_spotlight" || post.exerciseId === null;

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [post.headline, post.body, post.statsLabel, linkedExercise?.title ?? "", post.audience]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [allExercises, feedFilter, normalizedSearch, socialPosts]);
  const topCreators = accounts
    .filter((account) => account.role === "creator" || account.role === "admin")
    .map((account) => ({
      account,
      publishedCount: allExercises.filter((exercise) => exercise.creatorId === account.id).length
    }))
    .sort((left, right) => right.publishedCount - left.publishedCount)
    .slice(0, 3);
  const latestClosedExercise = closedExercises[0] ?? null;

  return (
    <>
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Social Posts</span>
          <h1>Community updates for new targets, reveal drops, and standout practice activity.</h1>
          <p>
            This feed turns live exercise movement into a public-facing stream without leaking blind target details
            before closure.
          </p>
          <div className="action-row">
            <Link className="button-primary" to="/exercises">
              Browse Exercise Feed
            </Link>
            <Link className="button-secondary" to="/workspace">
              Open Workspace
            </Link>
            <Link className="button-secondary" to="/review">
              Open Review Archive
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <span>Community Snapshot</span>
          <strong>{activeUser.name}</strong>
          <p>{socialPosts.length} recent posts are ready to scan.</p>
          <div className="hero-panel-actions">
            <span>Latest reveal</span>
            <strong>{latestClosedExercise?.title ?? "No closed reveal yet"}</strong>
            <p>
              {latestClosedExercise
                ? formatDateTime(latestClosedExercise.closesAt)
                : "Closed exercises will appear here once a session archive opens."}
            </p>
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <span>Active targets</span>
          <strong>{activeExercises.length}</strong>
          <p>Blind sessions currently feeding the public post stream.</p>
        </article>
        <article className="metric-card">
          <span>Closed reveals</span>
          <strong>{closedExercises.length}</strong>
          <p>Archives now open for scoring, discussion, and public comparison.</p>
        </article>
        <article className="metric-card">
          <span>Community posts</span>
          <strong>{socialPosts.length}</strong>
          <p>Derived from creator activity, reveals, and notable viewer practice volume.</p>
        </article>
        <article className="metric-card">
          <span>Conversation</span>
          <strong>{totalComments}</strong>
          <p>Comments posted across the public stream.</p>
        </article>
        <article className="metric-card">
          <span>Reactions</span>
          <strong>{totalReactions}</strong>
          <p>Community sentiment captured without leaving the page.</p>
        </article>
      </section>

      <section className="workspace-grid social-layout">
        <div className="main-column">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">{canPublishPosts ? "Create Post" : "Read And React"}</span>
                <h2>{canPublishPosts ? "Publish a community update" : "Join the public conversation"}</h2>
              </div>
              <p>
                {canPublishPosts
                  ? "Keep active exercise posts blind-safe. Use closed sessions for reveal commentary and score discussion."
                  : "Viewers can react and comment across the feed. Creator and admin accounts publish the main community updates."}
              </p>
            </div>

            {canPublishPosts ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void onPublishPost();
                }}
              >
                <div className="form-grid">
                  <label className="field">
                    <span>Headline</span>
                    <input
                      onChange={(event) => {
                        setSocialDraft((current) => ({ ...current, headline: event.target.value }));
                      }}
                      placeholder="Example: New target just opened"
                      value={socialDraft.headline}
                    />
                  </label>
                  <label className="field">
                    <span>Related exercise</span>
                    <select
                      onChange={(event) => {
                        setSocialDraft((current) => ({ ...current, exerciseId: event.target.value }));
                      }}
                      value={socialDraft.exerciseId}
                    >
                      <option value="">General community post</option>
                      {sortedExercises.map((exercise) => (
                        <option key={exercise.id} value={exercise.id}>
                          {exercise.title} ({closedExercises.some((item) => item.id === exercise.id) ? "Closed" : "Active"})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Post body</span>
                    <textarea
                      onChange={(event) => {
                        setSocialDraft((current) => ({ ...current, body: event.target.value }));
                      }}
                      placeholder="Share creator updates, practice momentum, or reveal thoughts without exposing an active target."
                      value={socialDraft.body}
                    />
                  </label>
                </div>

                <div className="social-composer-footer">
                  <p className="feedback">{socialFeedback}</p>
                  <div className="action-row">
                    <button className="button-primary" disabled={isPublishingSocialPost} type="submit">
                      {isPublishingSocialPost ? "Publishing..." : "Publish Post"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="social-readonly-card">
                <div className="detail-grid social-readonly-grid">
                  <article className="detail-card">
                    <span>Your role</span>
                    <strong>{getRoleLabel(activeUser.role)}</strong>
                    <p>Public feed posts come from creator and admin accounts so the main timeline stays accountable.</p>
                  </article>
                  <article className="detail-card">
                    <span>What you can do</span>
                    <strong>React, comment, and review</strong>
                    <p>Use reactions for fast signal, comments for nuance, and closed archives for accuracy scoring.</p>
                  </article>
                </div>
                <p className="feedback">{socialFeedback}</p>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Live Feed</span>
                <h2>Recent public posts</h2>
              </div>
              <p>Active exercises stay blind. Closed sessions can reference reveal material and scoring context.</p>
            </div>

            <div className="social-feed-toolbar">
              <label className="field social-search-field">
                <span>Search posts</span>
                <input
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by headline, body, status, or exercise"
                  value={searchTerm}
                />
              </label>
              <div aria-label="Feed filters" className="social-filter-row" role="tablist">
                {[
                  { key: "all", label: "All posts" },
                  { key: "blind_safe", label: "Blind-safe" },
                  { key: "reveals", label: "Reveals" },
                  { key: "community", label: "Community" }
                ].map((option) => (
                  <button
                    aria-pressed={feedFilter === option.key}
                    className={`social-filter-chip${feedFilter === option.key ? " is-active" : ""}`}
                    key={option.key}
                    onClick={() => setFeedFilter(option.key as typeof feedFilter)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="stack-list">
              {visiblePosts.length > 0 ? (
                visiblePosts.map((post) => {
                  const author = accounts.find((account) => account.id === post.authorId);
                  const linkedExercise = post.exerciseId
                    ? allExercises.find((exercise) => exercise.id === post.exerciseId)
                    : null;
                  const interaction = socialInteractions[post.id] ?? {
                    reactions: {
                      resonates: [],
                      curious: [],
                      sharp: []
                    },
                    comments: []
                  };

                  return (
                    <article className="submission-card social-post-card" key={post.id}>
                      <div className="exercise-top">
                        <div>
                          <span className="card-label">{post.kind.replace("_", " ")}</span>
                          <strong>{post.headline}</strong>
                        </div>
                        <span className="badge badge-muted">{post.audience}</span>
                      </div>
                      <div className="message-meta social-post-meta-strip">
                        <span>{author?.name ?? "PsyPerspective"}</span>
                        <span>{formatDateTime(post.createdAt)}</span>
                        <span>{linkedExercise?.title ?? "Community update"}</span>
                        <span>{post.statsLabel}</span>
                      </div>
                      <p>{post.body}</p>
                      <div className="social-post-footer">
                        <Link className="button-secondary" to={post.ctaPath}>
                          {post.ctaLabel}
                        </Link>
                      </div>
                      <div className="social-reaction-row">
                        {reactionOptions.map((option) => {
                          const count = interaction.reactions[option.key].length;
                          const isActive = interaction.reactions[option.key].includes(activeUser.id);

                          return (
                            <button
                              className={`social-reaction-button${isActive ? " is-active" : ""}`}
                              key={option.key}
                              onClick={() => onToggleReaction(post.id, option.key)}
                              type="button"
                            >
                              {option.label} {count > 0 ? `(${count})` : ""}
                            </button>
                          );
                        })}
                      </div>
                      <div className="social-comment-block">
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            void onAddComment(post.id);
                          }}
                        >
                          <label className="field">
                            <span>Add comment</span>
                            <textarea
                              onChange={(event) => {
                                const value = event.target.value;
                                setCommentDrafts((current) => ({ ...current, [post.id]: value }));
                              }}
                              placeholder="Add a reaction, reveal note, or practice observation."
                              value={commentDrafts[post.id] ?? ""}
                            />
                          </label>
                          <div className="action-row">
                            <button
                              className="button-secondary"
                              disabled={postingCommentIds.includes(post.id)}
                              type="submit"
                            >
                              {postingCommentIds.includes(post.id) ? "Posting..." : "Post Comment"}
                            </button>
                          </div>
                        </form>
                        <div className="stack-list social-comment-list">
                          {interaction.comments.length > 0 ? (
                            interaction.comments.map((comment) => {
                              const commentAuthor = accounts.find((account) => account.id === comment.authorId);

                              return (
                                <article className="detail-card social-comment-card" key={comment.id}>
                                  <div className="message-meta">
                                    <span>{commentAuthor?.name ?? "Community member"}</span>
                                    <span>{formatDateTime(comment.createdAt)}</span>
                                  </div>
                                  <p>{comment.body}</p>
                                </article>
                              );
                            })
                          ) : (
                            <div className="empty-card">
                              <strong>No comments yet</strong>
                              <p>Use this thread to discuss the post without leaving the page.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="empty-card">
                  <strong>No posts match the current filter</strong>
                  <p>Try a different filter or clear the search to bring community activity back into view.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="side-column">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Your Participation</span>
                <h2>Community footprint</h2>
              </div>
              <p>Track how actively you are contributing to the shared stream around exercises and reveals.</p>
            </div>

            <div className="social-summary-grid">
              <article className="detail-card social-summary-card">
                <span>Predictions</span>
                <strong>{userPredictionCount}</strong>
                <p>Saved submissions linked to your account across active and closed exercises.</p>
              </article>
              <article className="detail-card social-summary-card">
                <span>Comments</span>
                <strong>{userCommentCount}</strong>
                <p>Threaded notes you have added to feed posts and reveal conversations.</p>
              </article>
              <article className="detail-card social-summary-card">
                <span>Reactions</span>
                <strong>{userReactionCount}</strong>
                <p>Distinct post reactions currently attached to your account.</p>
              </article>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Top Creators</span>
                <h2>Publishing activity</h2>
              </div>
              <p>Accounts with the most visible exercise output rise to the top of the stream.</p>
            </div>

            <div className="stack-list">
              {topCreators.map(({ account, publishedCount }) => (
                <article className="detail-card" key={account.id}>
                  <span>{account.role === "admin" ? "Admin creator" : "Creator"}</span>
                  <strong>{account.name}</strong>
                  <p>{publishedCount} exercises published or archived in the current data set.</p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Posting Rules</span>
                <h2>What appears here</h2>
              </div>
              <p>Use the public feed for momentum, reveals, and safe updates that do not compromise active targets.</p>
            </div>

            <div className="social-guidance-grid">
              <div className="detail-card">
                <span>Blind safety</span>
                <strong>Active targets stay concealed</strong>
                <p>Posts for open sessions use cues, prompts, and activity totals without exposing the hidden target.</p>
              </div>
              <div className="detail-card">
                <span>Reveal unlock</span>
                <strong>Closed targets can show summaries</strong>
                <p>Once a session closes, reveal summaries and scoring context can move into the public feed.</p>
              </div>
              <div className="detail-card">
                <span>Conversation</span>
                <strong>Discussion stays attached to the post</strong>
                <p>Comments and reactions stay on-page so users can compare impressions without losing context.</p>
              </div>
              <div className="detail-card">
                <span>Publishing access</span>
                <strong>Creator-led timeline</strong>
                <p>Only creator and admin accounts can publish top-level feed posts. Viewers participate through comments and reactions.</p>
              </div>
              <div className="detail-card">
                <span>Community flow</span>
                <strong>Stored in the shared backend</strong>
                <p>This page reflects current exercises and participation while keeping posts, comments, and reactions synced across sessions.</p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
