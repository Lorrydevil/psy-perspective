import { Link } from "react-router-dom";
import { getWorkspaceLabel, isCreatorRole, type Exercise, type User } from "../../psy/types";

export default function OverviewPage({
  activeExercises,
  activeUser,
  closedExercises,
  feedback,
  savedPredictionCount,
  selectedExercise,
  unreadMessagesCount
}: {
  activeExercises: Exercise[];
  activeUser: User;
  closedExercises: Exercise[];
  feedback: string;
  savedPredictionCount: number;
  selectedExercise: Exercise | null;
  unreadMessagesCount: number;
}) {
  return (
    <>
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">PsyPerspective</span>
          <h1>Blind target sessions for drawing, impression capture, delayed reveal, and group scoring.</h1>
          <p>
            Creators publish hidden targets. Viewers sketch and write impressions without seeing the target. Only the
            creator can monitor live submissions until the exercise closes.
          </p>
        <div className="action-row">
          <Link className="button-primary" to="/exercises">
            Open Exercise Feed
          </Link>
          {isCreatorRole(activeUser.role) ? (
            <Link className="button-secondary" to="/console">
              Open Exercise Console
            </Link>
          ) : null}
          <Link className="button-secondary" to="/workspace">
            {`Open ${getWorkspaceLabel(activeUser.role)}`}
          </Link>
          <Link className="button-secondary" to="/social">
            Social Posts
          </Link>
          <Link className="button-secondary" to="/review">
            Review Archive
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <span>Session Mode</span>
          <strong>{isCreatorRole(activeUser.role) ? getWorkspaceLabel(activeUser.role) : "Remote Viewer"}</strong>
          <p>{activeUser.name}</p>
          <p>{activeUser.email}</p>
          <div className="hero-panel-actions">
            <span>Current focus</span>
            <strong>{selectedExercise?.title ?? "No exercise selected"}</strong>
            <p>{feedback}</p>
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <span>Open exercises</span>
          <strong>{activeExercises.length}</strong>
          <p>Blind sessions currently accepting predictions.</p>
        </article>
        <article className="metric-card">
          <span>Closed archive</span>
          <strong>{closedExercises.length}</strong>
          <p>Exercises open for reveal, review, and scoring.</p>
        </article>
        <article className="metric-card">
          <span>Your saved predictions</span>
          <strong>{savedPredictionCount}</strong>
          <p>Each viewer can revise their own prediction until closure.</p>
        </article>
        <article className="metric-card">
          <span>Unread messages</span>
          <strong>{unreadMessagesCount}</strong>
          <p>Direct notes from other users appear in your shared inbox.</p>
        </article>
        <article className="metric-card">
          <span>Live status</span>
          <strong>{feedback}</strong>
          <p>The latest creation, submission, or scoring action is reflected here.</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Quick Routes</span>
            <h2>Navigation now breaks the workspace into dedicated pages</h2>
          </div>
          <p>The previous long single-page flow is split so feed, messages, account work, tools, and review are easier to reach.</p>
        </div>

        <div className="detail-grid">
          <Link className="detail-card" to="/account">
            <span>Account Settings</span>
            <strong>Profile and practice preferences</strong>
            <p>Update your profile, password, alias, and shared workflow settings on a dedicated page.</p>
          </Link>
          <Link className="detail-card" to="/messages">
            <span>User Messages</span>
            <strong>{unreadMessagesCount > 0 ? `${unreadMessagesCount} unread` : "Inbox is clear"}</strong>
            <p>Keep direct creator-viewer notes separate from the public archive and exercise feed.</p>
          </Link>
          <Link className="detail-card" to="/social">
            <span>Social Posts</span>
            <strong>Community activity stream</strong>
            <p>Surface creator updates, reveal drops, and practice momentum in one public-facing feed.</p>
          </Link>
          <Link className="detail-card" to="/analytics">
            <span>Analytics</span>
            <strong>{isCreatorRole(activeUser.role) ? "Track publishing reach" : "Track prediction results"}</strong>
            <p>Review participation, scoring depth, and session activity in one dedicated view.</p>
          </Link>
          {isCreatorRole(activeUser.role) ? (
            <Link className="detail-card" to="/console">
              <span>Exercise Console</span>
              <strong>Manage live targets</strong>
              <p>Inspect your blind sessions, reveal packages, and prediction intake without opening each page separately.</p>
            </Link>
          ) : null}
          <Link className="detail-card" to="/exercises">
            <span>Exercise Feed</span>
            <strong>{selectedExercise?.title ?? "Choose a target"}</strong>
            <p>Browse active and closed sessions, then move into the workspace or archive from the selected target.</p>
          </Link>
          <Link className="detail-card" to="/workspace">
            <span>{getWorkspaceLabel(activeUser.role)}</span>
            <strong>{isCreatorRole(activeUser.role) ? "Open a new target" : "Capture your impression"}</strong>
            <p>{isCreatorRole(activeUser.role) ? "Build blind cues and reveal packages." : "Draw, write, and save a prediction."}</p>
          </Link>
        </div>
      </section>
    </>
  );
}
