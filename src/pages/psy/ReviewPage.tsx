import { Link } from "react-router-dom";
import type { Exercise, Score, ScoreDraft, User } from "../../psy/types";

function averageScore(scores: Score[]) {
  if (scores.length === 0) {
    return null;
  }

  return scores.reduce((total, score) => total + score.accuracy, 0) / scores.length;
}

export default function ReviewPage({
  accounts,
  activeUser,
  formatDateTime,
  onSaveScore,
  onUpdateScoreDraft,
  scoreDrafts,
  selectedExercise
}: {
  accounts: User[];
  activeUser: User;
  formatDateTime: (value: string) => string;
  onSaveScore: (exerciseId: string, predictionId: string) => void;
  onUpdateScoreDraft: (predictionId: string, field: "accuracy" | "comment", value: number | string) => void;
  scoreDrafts: Record<string, ScoreDraft>;
  selectedExercise: Exercise | null;
}) {
  if (!selectedExercise || new Date(selectedExercise.closesAt).getTime() > Date.now()) {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Review Lock</span>
            <h2>Archive stays sealed until closure</h2>
          </div>
          <p>Public reveal and community scoring only open after the exercise end time.</p>
        </div>

        <div className="stack-list">
          <div className="empty-card">
            <strong>While active</strong>
            <p>Viewers only see the blind cue and their own submission state.</p>
          </div>
          <div className="empty-card">
            <strong>After closure</strong>
            <p>Target details, all predictions, and rating controls become available to everyone.</p>
          </div>
          <Link className="button-secondary" to="/exercises">
            Return to Exercise Feed
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Closed Review</span>
            <h2>{selectedExercise.title}</h2>
          </div>
          <p>Target reveal, predictions, and community scoring are now open for this session.</p>
        </div>

        <div className="detail-grid">
          <div className="detail-card">
            <span>Blind cue</span>
            <strong>{selectedExercise.blindCue}</strong>
            <p>Originally shown during the blind session.</p>
          </div>
          <div className="detail-card">
            <span>Hidden target</span>
            <strong>{selectedExercise.hiddenTarget}</strong>
            <p>{selectedExercise.revealSummary}</p>
          </div>
          <div className="detail-card">
            <span>Closed at</span>
            <strong>{formatDateTime(selectedExercise.closesAt)}</strong>
            <p>{selectedExercise.predictions.length} prediction(s) are now visible to all users.</p>
          </div>
        </div>

        {selectedExercise.targetImageData ? (
          <div className="detail-card reveal-media-card">
            <span>Reveal image</span>
            <strong>{selectedExercise.targetImageName || "Uploaded target image"}</strong>
            <img
              alt={`${selectedExercise.title} target reveal`}
              className="submission-image target-preview-image"
              src={selectedExercise.targetImageData}
            />
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Scoring</span>
            <h2>Score prediction accuracy</h2>
          </div>
          <p>Once the timer expires, all users can review the target, the predictions, and add scores.</p>
        </div>

        <div className="stack-list">
          {selectedExercise.predictions.length > 0 ? (
            selectedExercise.predictions.map((prediction) => {
              const predictionUser = accounts.find((user) => user.id === prediction.userId);
              const predictionScores = selectedExercise.scores.filter((score) => score.predictionId === prediction.id);
              const mean = averageScore(predictionScores);
              const savedScore = predictionScores.find((score) => score.userId === activeUser.id);
              const draft = scoreDrafts[prediction.id] ?? {
                accuracy: savedScore?.accuracy ?? 3,
                comment: savedScore?.comment ?? ""
              };

              return (
                <div className="submission-card" key={prediction.id}>
                  <strong>{`${predictionUser?.name ?? "Unknown viewer"} - Entry ${prediction.entryNumber}`}</strong>
                  <p>{formatDateTime(prediction.submittedAt)}</p>
                  <p>{prediction.notes || "No written notes attached."}</p>
                  {prediction.imageData ? <img alt="Prediction sketch" className="submission-image" src={prediction.imageData} /> : null}
                  <div className="score-row">
                    <span>Average score</span>
                    <strong>{mean ? `${mean.toFixed(1)} / 5` : "No scores yet"}</strong>
                  </div>
                  <label className="field">
                    <span>Your accuracy score</span>
                    <input
                      max="5"
                      min="1"
                      onChange={(event) => onUpdateScoreDraft(prediction.id, "accuracy", Number(event.target.value))}
                      type="range"
                      value={draft.accuracy}
                    />
                  </label>
                  <label className="field">
                    <span>Your comment</span>
                    <textarea
                      onChange={(event) => onUpdateScoreDraft(prediction.id, "comment", event.target.value)}
                      placeholder="What matched and what missed?"
                      value={draft.comment}
                    />
                  </label>
                  <button className="button-primary" onClick={() => onSaveScore(selectedExercise.id, prediction.id)} type="button">
                    Save Score ({draft.accuracy}/5)
                  </button>
                </div>
              );
            })
          ) : (
            <div className="empty-card">
              <strong>No predictions were submitted</strong>
              <p>This exercise closed without participant entries.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
