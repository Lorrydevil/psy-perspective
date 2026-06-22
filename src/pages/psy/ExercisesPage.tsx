import { Link } from "react-router-dom";
import { getWorkspaceLabel, isCreatorRole, type Exercise, type User } from "../../psy/types";

export default function ExercisesPage({
  accounts,
  activeUser,
  canSeeLivePredictions,
  canSeeReveal,
  creatorName,
  formatDateTime,
  isClosed,
  onSelectExercise,
  selectedExercise,
  sortedExercises
}: {
  accounts: User[];
  activeUser: User;
  canSeeLivePredictions: (exercise: Exercise) => boolean;
  canSeeReveal: (exercise: Exercise) => boolean;
  creatorName: string;
  formatDateTime: (value: string) => string;
  isClosed: (exercise: Exercise) => boolean;
  onSelectExercise: (exerciseId: string) => void;
  selectedExercise: Exercise | null;
  sortedExercises: Exercise[];
}) {
  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Exercise Feed</span>
            <h2>Current and archived targets</h2>
          </div>
          <p>Pick an exercise, inspect the blind cue, then move into the workspace or delayed review page.</p>
        </div>

        {sortedExercises.length > 0 ? (
          <div className="stack-list">
            {sortedExercises.map((exercise) => {
              const predictionCount = exercise.predictions.length;
              const sessionLabel =
                exercise.status === "scheduled"
                  ? "Scheduled Session"
                  : isClosed(exercise)
                    ? "Closed Archive"
                    : "Active Exercise";

              return (
                <button
                  className={`exercise-card${selectedExercise?.id === exercise.id ? " is-selected" : ""}`}
                  key={exercise.id}
                  onClick={() => onSelectExercise(exercise.id)}
                  type="button"
                >
                  <div className="exercise-top">
                    <div>
                      <span className="card-label">{sessionLabel}</span>
                      <strong>{`#${exercise.exerciseNumber} ${exercise.title}`}</strong>
                    </div>
                    <span className={`badge ${isClosed(exercise) ? "badge-muted" : "badge-warm"}`}>
                      {exercise.status === "scheduled" ? "Scheduled" : isClosed(exercise) ? "Review Open" : "Blind"}
                    </span>
                  </div>
                  <p>{exercise.viewerPrompt || "Use your normal blind-viewing workflow."}</p>
                  <div className="exercise-meta">
                    <span>{exercise.blindCue}</span>
                    <span>{predictionCount} predictions</span>
                    <span>{exercise.maxEntriesPerViewer} entries max</span>
                    <span>Closes {formatDateTime(exercise.closesAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty-card">
            <strong>No published exercises yet</strong>
            <p>
              New blind targets will appear here after a creator publishes them. Creator and admin accounts can open
              the exercise console to prepare the first session.
            </p>
          </div>
        )}
      </section>

      {selectedExercise ? (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Selected Exercise</span>
              <h2>{selectedExercise.title}</h2>
            </div>
            <p>
              Created by {creatorName}. {isClosed(selectedExercise) ? "Reveal is open." : selectedExercise.status === "scheduled" ? "Target is scheduled." : "Target is still blind."}
            </p>
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <span>Blind cue</span>
              <strong>{selectedExercise.blindCue}</strong>
              <p>Participants only see this cue until reveal unlocks.</p>
            </div>
            <div className="detail-card">
              <span>Viewer prompt</span>
              <strong>{selectedExercise.viewerPrompt || "Use your normal blind-viewing workflow."}</strong>
              <p>Creators can now attach a guidance prompt without exposing the target itself.</p>
            </div>
            <div className="detail-card">
              <span>Target visibility</span>
              <strong>{canSeeReveal(selectedExercise) ? selectedExercise.hiddenTarget : "Hidden until reveal unlocks"}</strong>
              <p>
                {canSeeReveal(selectedExercise)
                  ? selectedExercise.revealSummary
                  : selectedExercise.revealPolicy === "on_start"
                    ? "This target reveals as soon as the session start time is reached."
                  : selectedExercise.revealPolicy === "on_completion"
                    ? "This target reveals after you complete all allowed entries or when the exercise closes."
                    : "Creators hold the target privately while viewers submit impressions."}
              </p>
            </div>
            <div className="detail-card">
              <span>Submission privacy</span>
              <strong>
                {canSeeLivePredictions(selectedExercise)
                  ? "You can inspect predictions live"
                  : "Predictions stay hidden from you until closure"}
              </strong>
              <p>Only the target creator can watch entries arrive while the session is active.</p>
            </div>
            <div className="detail-card">
              <span>Schedule</span>
              <strong>{formatDateTime(selectedExercise.startsAt)}</strong>
              <p>{selectedExercise.maxEntriesPerViewer} entries allowed per viewer.</p>
            </div>
          </div>

          {canSeeReveal(selectedExercise) && selectedExercise.targetImageData ? (
            <div className="detail-card reveal-media-card">
              <span>Reveal image</span>
              <strong>{selectedExercise.targetImageName || "Uploaded target image"}</strong>
              <p>The creator attached this hidden reference image to unlock with the archive reveal.</p>
              <img
                alt={`${selectedExercise.title} target reveal`}
                className="submission-image target-preview-image"
                src={selectedExercise.targetImageData}
              />
            </div>
          ) : null}

          <div className="action-row">
            <Link className="button-primary" to="/workspace">
              {`Open ${getWorkspaceLabel(activeUser.role)}`}
            </Link>
            <Link className="button-secondary" to="/review">
              Open Review
            </Link>
          </div>
        </section>
      ) : null}

      {selectedExercise && canSeeLivePredictions(selectedExercise) ? (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Creator Feed</span>
              <h2>Live predictions</h2>
            </div>
            <p>{isCreatorRole(activeUser.role) ? "Creator and admin accounts can inspect this live feed while the exercise remains active." : "Only the target creator sees this list while the exercise remains active."}</p>
          </div>

          <div className="stack-list">
            {selectedExercise.predictions.length > 0 ? (
              selectedExercise.predictions.map((prediction) => {
                const predictionUser = accounts.find((user) => user.id === prediction.userId);

                return (
                  <div className="submission-card" key={prediction.id}>
                    <strong>{predictionUser?.name ?? "Unknown viewer"}</strong>
                    <p>{formatDateTime(prediction.submittedAt)}</p>
                    <p>{prediction.notes || "No written notes attached."}</p>
                    {prediction.imageData ? (
                      <img alt="Prediction sketch" className="submission-image" src={prediction.imageData} />
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="empty-card">
                <strong>No predictions yet</strong>
                <p>This feed updates as viewers save new impressions.</p>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}
