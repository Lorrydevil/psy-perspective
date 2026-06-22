import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getWorkspaceLabel, isCreatorRole, type CreateFormState, type Exercise, type User } from "../../psy/types";

export default function ExerciseConsolePage({
  accounts,
  activeUser,
  activeBlindCueConflict,
  canEditExercise,
  completedChecklistCount,
  creatorAccounts,
  createForm,
  createPreviewCloseTime,
  creationChecklist,
  formatDateTime,
  isClosed,
  managedExercises,
  onEditExercise,
  onSelectExercise,
  selectedExercise
}: {
  accounts: User[];
  activeUser: User;
  activeBlindCueConflict: boolean;
  canEditExercise: (exercise: Exercise) => boolean;
  completedChecklistCount: number;
  creatorAccounts: User[];
  createForm: CreateFormState;
  createPreviewCloseTime: string;
  creationChecklist: Array<{ label: string; complete: boolean }>;
  formatDateTime: (value: string) => string;
  isClosed: (exercise: Exercise) => boolean;
  managedExercises: Exercise[];
  onEditExercise: (exercise: Exercise) => void;
  onSelectExercise: (exerciseId: string) => void;
  selectedExercise: Exercise | null;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed" | "backlog">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const activeManagedExercises = managedExercises.filter(
    (exercise) => exercise.status === "active" || exercise.status === "scheduled"
  );
  const closedManagedExercises = managedExercises.filter((exercise) => isClosed(exercise));
  const draftManagedExercises = managedExercises.filter((exercise) => exercise.status === "draft");
  const predictionTotal = managedExercises.reduce((total, exercise) => total + exercise.predictions.length, 0);
  const scoreBacklog = closedManagedExercises.filter((exercise) => exercise.scores.length === 0).length;
  const totalUniqueParticipants = new Set(
    managedExercises.flatMap((exercise) => exercise.predictions.map((prediction) => prediction.userId))
  ).size;
  const latestPredictionAt = useMemo(() => {
    const timestamps = managedExercises.flatMap((exercise) =>
      exercise.predictions
        .map((prediction) => new Date(prediction.submittedAt).getTime())
        .filter((timestamp) => !Number.isNaN(timestamp))
    );
    const latestTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : null;
    return latestTimestamp === null ? "No submissions yet" : formatDateTime(new Date(latestTimestamp).toISOString());
  }, [formatDateTime, managedExercises]);
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredExercises = managedExercises.filter((exercise) => {
    const matchesSearch =
      !normalizedSearchTerm ||
      [exercise.title, exercise.blindCue, exercise.hiddenTarget]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearchTerm);

    if (!matchesSearch) {
      return false;
    }

    if (statusFilter === "active") {
      return exercise.status === "active" || exercise.status === "scheduled";
    }

    if (statusFilter === "closed") {
      return isClosed(exercise);
    }

    if (statusFilter === "backlog") {
      return isClosed(exercise) && exercise.scores.length === 0;
    }

    return true;
  });
  const draftStarted = creationChecklist.some((item) => item.complete);
  const selectedExerciseScoresByPrediction = selectedExercise
    ? selectedExercise.predictions.map((prediction) => ({
        predictionId: prediction.id,
        prediction,
        scores: selectedExercise.scores.filter((score) => score.predictionId === prediction.id)
      }))
    : [];
  const actionQueue = useMemo(() => {
    return managedExercises
      .map((exercise) => {
        const participantCount = new Set(exercise.predictions.map((prediction) => prediction.userId)).size;

        if (exercise.status === "draft") {
          return {
            exercise,
            label: "Draft",
            detail: "Finish the publish checklist and move this target into the live feed.",
            priority: 4
          };
        }

        if (exercise.status === "scheduled") {
          return {
            exercise,
            label: "Scheduled",
            detail: `Starts ${formatDateTime(exercise.startsAt)}. Review the reveal package and timing before it opens.`,
            priority: 3
          };
        }

        if (!isClosed(exercise) && exercise.predictions.length === 0) {
          return {
            exercise,
            label: "No intake yet",
            detail: "This live target has no predictions yet. It may need promotion or clearer viewer guidance.",
            priority: 2
          };
        }

        if (isClosed(exercise) && exercise.scores.length === 0) {
          return {
            exercise,
            label: "Needs scoring",
            detail: `${exercise.predictions.length} prediction${exercise.predictions.length === 1 ? "" : "s"} are revealed and waiting on first archive scores.`,
            priority: 1
          };
        }

        return {
          exercise,
          label: participantCount > 0 ? "Healthy" : "Quiet",
          detail:
            participantCount > 0
              ? `${participantCount} viewer${participantCount === 1 ? "" : "s"} have participated in this session.`
              : "No immediate action is required, but participant activity is still low.",
          priority: 0
        };
      })
      .sort((left, right) => right.priority - left.priority || left.exercise.exerciseNumber - right.exercise.exerciseNumber)
      .slice(0, 4);
  }, [formatDateTime, isClosed, managedExercises]);
  const recentPredictions = useMemo(() => {
    return managedExercises
      .flatMap((exercise) =>
        exercise.predictions.map((prediction) => ({
          exerciseId: exercise.id,
          exerciseTitle: exercise.title,
          blindCue: exercise.blindCue,
          prediction
        }))
      )
      .sort((left, right) => new Date(right.prediction.submittedAt).getTime() - new Date(left.prediction.submittedAt).getTime())
      .slice(0, 5);
  }, [managedExercises]);
  const selectedExerciseLatestPrediction = selectedExercise
    ? [...selectedExercise.predictions].sort(
        (left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()
      )[0] ?? null
    : null;
  const selectedExerciseParticipantCount = selectedExercise
    ? new Set(selectedExercise.predictions.map((prediction) => prediction.userId)).size
    : 0;
  const selectedExerciseCoCreators = selectedExercise
    ? accounts.filter((account) => selectedExercise.coCreatorIds.includes(account.id))
    : [];

  function getSessionLabel(exercise: Exercise) {
    if (exercise.status === "draft") {
      return "Draft";
    }

    if (exercise.status === "scheduled") {
      return "Scheduled Session";
    }

    return isClosed(exercise) ? "Closed Archive" : "Active Session";
  }

  function getSessionStateText(exercise: Exercise) {
    if (exercise.status === "draft") {
      return "This draft is hidden from viewers.";
    }

    if (exercise.status === "scheduled") {
      return "This session is scheduled and has not started yet.";
    }

    return isClosed(exercise) ? "The archive is open." : "This session is still live.";
  }

  if (!isCreatorRole(activeUser.role)) {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Exercise Console</span>
            <h2>Creator access required</h2>
          </div>
          <p>This page is reserved for creator and admin accounts that manage hidden targets and live predictions.</p>
        </div>
        <div className="empty-card">
          <strong>Viewer accounts use the prediction workspace instead</strong>
          <p>Open the feed to select a target, then move into the pad to submit an impression.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Exercise Console</span>
            <h2>Manage hidden targets and monitor session health</h2>
          </div>
          <p>
            {activeUser.role === "admin"
              ? "Admin accounts can inspect every published exercise, including active reveal packages and scoring backlog."
              : "Creator accounts can monitor their own live sessions, reveal packages, and scoring backlog from one page."}
          </p>
        </div>

        <div className="metrics-grid">
          <article className="metric-card">
            <span>Managed exercises</span>
            <strong>{managedExercises.length}</strong>
            <p>{activeUser.role === "admin" ? "All exercises in the shared system." : "Targets you currently own."}</p>
          </article>
          <article className="metric-card">
            <span>Active sessions</span>
            <strong>{activeManagedExercises.length}</strong>
            <p>Blind targets still accepting incoming predictions.</p>
          </article>
          <article className="metric-card">
            <span>Drafts in queue</span>
            <strong>{draftManagedExercises.length}</strong>
            <p>Targets that still need publishing work before viewers can access them.</p>
          </article>
          <article className="metric-card">
            <span>Predictions received</span>
            <strong>{predictionTotal}</strong>
            <p>Total submissions across the exercises you can manage.</p>
          </article>
          <article className="metric-card">
            <span>Scoring backlog</span>
            <strong>{scoreBacklog}</strong>
            <p>Closed exercises that have no archive scores yet.</p>
          </article>
          <article className="metric-card">
            <span>Unique participants</span>
            <strong>{totalUniqueParticipants}</strong>
            <p>Distinct viewers who have submitted into your managed sessions.</p>
          </article>
          <article className="metric-card">
            <span>Latest submission</span>
            <strong>{latestPredictionAt}</strong>
            <p>The most recent prediction timestamp across your managed exercises.</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Creator Draft</span>
            <h2>Publishing pipeline status</h2>
          </div>
          <p>Keep a target draft moving from checklist to publish without leaving the console.</p>
        </div>

        <div className="detail-grid">
          <div className="detail-card creator-status-card">
            <span>Current draft</span>
            <strong>{createForm.title.trim() || "Untitled exercise draft"}</strong>
            <p>
              {draftStarted
                ? `${completedChecklistCount}/${creationChecklist.length} publish fields are ready.`
                : "No creator draft has been started yet for this account."}
            </p>
            <div className="status-list">
              <div className="status-row">
                <strong>Draft mode</strong>
                <span>{createForm.exerciseId ? `Editing #${createForm.exerciseNumber ?? "pending"}` : "New exercise"}</span>
              </div>
              <div className="status-row">
                <strong>Blind cue</strong>
                <span>{createForm.blindCue.trim() || "Not set"}</span>
              </div>
              <div className="status-row">
                <strong>Co-creators</strong>
                <span>{createForm.coCreatorIds.length > 0 ? createForm.coCreatorIds.length : "None"}</span>
              </div>
              <div className="status-row">
                <strong>Closes</strong>
                <span>{createPreviewCloseTime}</span>
              </div>
              <div className="status-row">
                <strong>Conflict check</strong>
                <span>{activeBlindCueConflict ? "Matches an active cue" : "No active cue conflict"}</span>
              </div>
            </div>
          </div>

          <div className="detail-card creator-status-card">
            <span>Checklist</span>
            <strong>{draftStarted ? "Ready to refine" : "Waiting for draft input"}</strong>
            <div className="status-list">
              <div className="status-row">
                <strong>Reveal timing</strong>
                <span>
                  {createForm.revealPolicy === "on_completion"
                    ? "On viewer completion"
                    : createForm.revealPolicy === "on_start"
                      ? "From start"
                      : "On expiry"}
                </span>
              </div>
              <div className="status-row">
                <strong>Viewer entry cap</strong>
                <span>{createForm.maxEntriesPerViewer || "1"} per viewer</span>
              </div>
              <div className="status-row">
                <strong>Available co-creators</strong>
                <span>{creatorAccounts.length}</span>
              </div>
              {creationChecklist.map((item) => (
                <div className="status-row" key={item.label}>
                  <strong>{item.label}</strong>
                  <span className={`badge ${item.complete ? "badge-success" : "badge-muted"}`}>
                    {item.complete ? "Ready" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="action-row">
          <Link className="button-primary" to="/workspace">
            {draftStarted ? "Continue Draft" : `Open ${getWorkspaceLabel(activeUser.role)}`}
          </Link>
          <Link className="button-secondary" to="/exercises">
            Inspect Public Feed
          </Link>
          <Link className="button-secondary" to="/review">
            Check Review Archive
          </Link>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Managed Sessions</span>
            <h2>{managedExercises.length > 0 ? "Select an exercise to inspect" : "No managed exercises yet"}</h2>
          </div>
          <p>
            {managedExercises.length > 0
              ? "Use this list to jump between active targets and closed archives without leaving the management view."
              : "Create a new target from the workspace to populate this console."}
          </p>
        </div>

        {actionQueue.length > 0 ? (
          <div className="console-queue-grid">
            {actionQueue.map(({ detail, exercise, label }) => (
              <button
                className={`detail-card console-queue-card${selectedExercise?.id === exercise.id ? " is-selected" : ""}`}
                key={`${exercise.id}-${label}`}
                onClick={() => onSelectExercise(exercise.id)}
                type="button"
              >
                <span>{label}</span>
                <strong>{exercise.title}</strong>
                <p>{detail}</p>
              </button>
            ))}
          </div>
        ) : null}

        {managedExercises.length > 0 ? (
          <div className="console-toolbar">
            <label className="field console-search-field">
              <span>Search sessions</span>
              <input
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Title, blind cue, or hidden target"
                type="search"
                value={searchTerm}
              />
            </label>

            <div className="action-row">
              <button
                className={`analytics-filter-chip${statusFilter === "all" ? " is-active" : ""}`}
                onClick={() => setStatusFilter("all")}
                type="button"
              >
                All sessions
              </button>
              <button
                className={`analytics-filter-chip${statusFilter === "active" ? " is-active" : ""}`}
                onClick={() => setStatusFilter("active")}
                type="button"
              >
                Active only
              </button>
              <button
                className={`analytics-filter-chip${statusFilter === "closed" ? " is-active" : ""}`}
                onClick={() => setStatusFilter("closed")}
                type="button"
              >
                Closed only
              </button>
              <button
                className={`analytics-filter-chip${statusFilter === "backlog" ? " is-active" : ""}`}
                onClick={() => setStatusFilter("backlog")}
                type="button"
              >
                Score backlog
              </button>
            </div>
          </div>
        ) : null}

        {filteredExercises.length > 0 ? (
          <div className="stack-list">
            {filteredExercises.map((exercise) => {
              const owner = accounts.find((account) => account.id === exercise.creatorId);
              const closed = isClosed(exercise);
              const needsScores = closed && exercise.scores.length === 0;
              const uniqueParticipants = new Set(exercise.predictions.map((prediction) => prediction.userId)).size;

              return (
                <button
                  className={`exercise-card${selectedExercise?.id === exercise.id ? " is-selected" : ""}`}
                  key={exercise.id}
                  onClick={() => onSelectExercise(exercise.id)}
                  type="button"
                >
                  <div className="exercise-top">
                    <div>
                      <span className="card-label">{getSessionLabel(exercise)}</span>
                      <strong>{exercise.title}</strong>
                    </div>
                    <div className="action-row">
                      <span className={`badge ${closed ? "badge-muted" : "badge-warm"}`}>
                        {exercise.status === "draft" ? "Draft" : closed ? "Review Open" : "Blind Live"}
                      </span>
                      {needsScores ? <span className="badge badge-success">Needs first score</span> : null}
                    </div>
                  </div>
                  <p>{exercise.viewerPrompt || "No viewer guidance attached."}</p>
                  <div className="exercise-meta">
                    <span>#{exercise.exerciseNumber}</span>
                    <span>{exercise.blindCue}</span>
                    <span>{exercise.predictions.length} predictions</span>
                    <span>{uniqueParticipants} viewers</span>
                    <span>{exercise.scores.length} scores</span>
                    <span>{owner?.name ?? "Unknown creator"}</span>
                    <span>{closed ? `Closed ${formatDateTime(exercise.closesAt)}` : `Closes ${formatDateTime(exercise.closesAt)}`}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty-card">
            <strong>{managedExercises.length > 0 ? "No exercises match this filter" : "No exercises to manage"}</strong>
            <p>
              {managedExercises.length > 0
                ? "Switch filters to inspect other sessions or backlog states."
                : "Your console will show live targets here once a creator or admin publishes them."}
            </p>
          </div>
        )}
      </section>

      {selectedExercise ? (
        <>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Selected Session</span>
                <h2>{selectedExercise.title}</h2>
              </div>
              <p>
                Blind cue {selectedExercise.blindCue}. {getSessionStateText(selectedExercise)}
              </p>
            </div>

            <div className="detail-grid">
              <div className="detail-card">
                <span>Tracking</span>
                <strong>Exercise #{selectedExercise.exerciseNumber}</strong>
                <p>
                  {selectedExercise.status === "draft"
                    ? "Saved as draft and hidden from viewers."
                    : selectedExercise.status === "scheduled"
                      ? "Scheduled for a future start and ready for creator review."
                      : "Live exercise tracking number for creator review."}
                </p>
              </div>
              <div className="detail-card">
                <span>Owner</span>
                <strong>{accounts.find((account) => account.id === selectedExercise.creatorId)?.name ?? "Unknown creator"}</strong>
                <p>{activeUser.role === "admin" ? "Admin view includes all creators." : "You are managing this target."}</p>
              </div>
              <div className="detail-card">
                <span>Co-creators</span>
                <strong>{selectedExerciseCoCreators.length > 0 ? selectedExerciseCoCreators.map((account) => account.name).join(", ") : "Solo owner"}</strong>
                <p>
                  {selectedExerciseCoCreators.length > 0
                    ? "These creators can help maintain the reveal package and manage the session."
                    : "No additional managers are assigned to this exercise."}
                </p>
              </div>
              <div className="detail-card">
                <span>Timeline</span>
                <strong>{formatDateTime(selectedExercise.startsAt)}</strong>
                <p>{isClosed(selectedExercise) ? `Closed ${formatDateTime(selectedExercise.closesAt)}.` : `Closes ${formatDateTime(selectedExercise.closesAt)}.`}</p>
              </div>
              <div className="detail-card">
                <span>Hidden target</span>
                <strong>{selectedExercise.hiddenTarget}</strong>
                <p>{selectedExercise.revealSummary}</p>
              </div>
              <div className="detail-card">
                <span>Engagement</span>
                <strong>{selectedExercise.predictions.length} predictions</strong>
                <p>{selectedExercise.scores.length} archive scores recorded so far. Limit {selectedExercise.maxEntriesPerViewer} per viewer.</p>
              </div>
              <div className="detail-card">
                <span>Coverage</span>
                <strong>{selectedExerciseParticipantCount} viewers</strong>
                <p>
                  {selectedExercise.predictions.length > 0
                    ? `${selectedExerciseScoresByPrediction.filter((entry) => entry.scores.length > 0).length} prediction(s) have at least one score.`
                    : "No viewer participation has been recorded yet."}
                </p>
              </div>
              <div className="detail-card">
                <span>Reveal policy</span>
                <strong>
                  {selectedExercise.revealPolicy === "on_completion"
                    ? "Reveal on completion"
                    : selectedExercise.revealPolicy === "on_start"
                      ? "Reveal from start"
                      : "Reveal on expiry"}
                </strong>
                <p>
                  {selectedExercise.revealPolicy === "on_completion"
                    ? "Viewers unlock the target after finishing their allowed entries or when the timer closes."
                    : selectedExercise.revealPolicy === "on_start"
                      ? "The target becomes visible to viewers as soon as the scheduled start time is reached."
                      : "The target stays blind until the exercise expiry time is reached."}
                </p>
              </div>
              <div className="detail-card">
                <span>Latest intake</span>
                <strong>
                  {selectedExerciseLatestPrediction ? formatDateTime(selectedExerciseLatestPrediction.submittedAt) : "No submissions yet"}
                </strong>
                <p>
                  {selectedExerciseLatestPrediction
                    ? `${accounts.find((account) => account.id === selectedExerciseLatestPrediction.userId)?.name ?? "Unknown viewer"} submitted the most recent prediction.`
                    : "The first sketch or note will appear here as soon as a viewer saves it."}
                </p>
              </div>
            </div>

            {selectedExercise.targetImageData ? (
              <div className="detail-card reveal-media-card">
                <span>Reveal package</span>
                <strong>{selectedExercise.targetImageName || "Uploaded target image"}</strong>
                <p>This source image stays attached to the target and is visible here inside the management console.</p>
                <img
                  alt={`${selectedExercise.title} target reveal`}
                  className="submission-image target-preview-image"
                  src={selectedExercise.targetImageData}
                />
              </div>
            ) : null}

            <div className="action-row">
              {canEditExercise(selectedExercise) ? (
                <button className="button-secondary" onClick={() => onEditExercise(selectedExercise)} type="button">
                  Edit Before Start
                </button>
              ) : null}
              <Link className="button-primary" to="/workspace">
                {`Open ${getWorkspaceLabel(activeUser.role)}`}
              </Link>
              <Link className="button-secondary" to="/exercises">
                Open Exercise Feed
              </Link>
              <Link className="button-secondary" to="/review">
                Open Review
              </Link>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Recent Activity</span>
                <h2>Latest submissions across managed sessions</h2>
              </div>
              <p>
                {recentPredictions.length > 0
                  ? "Use this feed to spot fresh activity without manually opening each session first."
                  : "Prediction activity will appear here once viewers begin saving entries."}
              </p>
            </div>

            {recentPredictions.length > 0 ? (
              <div className="analytics-list">
                {recentPredictions.map(({ blindCue, exerciseId, exerciseTitle, prediction }) => {
                  const participant = accounts.find((account) => account.id === prediction.userId);

                  return (
                    <button
                      className="analytics-row console-activity-row"
                      key={prediction.id}
                      onClick={() => onSelectExercise(exerciseId)}
                      type="button"
                    >
                      <div>
                        <strong>{participant?.name ?? "Unknown viewer"}</strong>
                        <p>
                          {exerciseTitle} | {blindCue} | Entry {prediction.entryNumber}
                        </p>
                      </div>
                      <span className="analytics-pill">{formatDateTime(prediction.submittedAt)}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="empty-card">
                <strong>No recent submission activity</strong>
                <p>Once predictions arrive, the most recent entries will surface here for quick triage.</p>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Prediction Intake</span>
                <h2>Live submissions and notes</h2>
              </div>
              <p>
                {selectedExercise.predictions.length > 0
                  ? "Entries are listed newest first so creators can review signal patterns as they arrive."
                  : "This exercise has not received any predictions yet."}
              </p>
            </div>

            {isClosed(selectedExercise) && selectedExercise.predictions.length > 0 ? (
              <div className="detail-grid">
                {selectedExerciseScoresByPrediction.map(({ prediction, predictionId, scores }) => {
                  const participant = accounts.find((account) => account.id === prediction.userId);

                  return (
                    <div className="detail-card" key={predictionId}>
                      <span>Scoring status</span>
                      <strong>{participant?.name ?? "Unknown viewer"}</strong>
                      <p>{scores.length > 0 ? `${scores.length} score(s) recorded.` : "No archive scores yet for this prediction."}</p>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {selectedExercise.predictions.length > 0 ? (
              <div className="stack-list">
                {[...selectedExercise.predictions]
                  .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime())
                  .map((prediction) => {
                    const participant = accounts.find((account) => account.id === prediction.userId);

                    return (
                      <div className="submission-card" key={prediction.id}>
                        <div className="exercise-top">
                          <div>
                            <span className="card-label">Prediction</span>
                            <strong>{participant?.name ?? "Unknown viewer"}</strong>
                          </div>
                          <span className="badge badge-muted">{`Entry ${prediction.entryNumber} - ${formatDateTime(prediction.submittedAt)}`}</span>
                        </div>
                        <p>{prediction.notes || "No written notes attached."}</p>
                        {prediction.imageData ? (
                          <img alt="Prediction sketch" className="submission-image" src={prediction.imageData} />
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="empty-card">
                <strong>No prediction records yet</strong>
                <p>Viewer sketches and notes will appear here as soon as they save them.</p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
