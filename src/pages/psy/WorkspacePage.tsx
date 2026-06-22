import type { ChangeEvent, Dispatch, MutableRefObject, PointerEvent as ReactPointerEvent, SetStateAction } from "react";
import { getWorkspaceLabel, isCreatorRole, type CreateFormState, type Exercise, type Prediction, type User } from "../../psy/types";

const CANVAS_WIDTH = 880;
const CANVAS_HEIGHT = 500;

export default function WorkspacePage({
  activeBlindCueConflict,
  activeUser,
  canvasRef,
  completedChecklistCount,
  creatorAccounts,
  createForm,
  createPreviewCloseTime,
  creationChecklist,
  formatDateTime,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handleTargetImageChange,
  onClearCanvas,
  onCreateExercise,
  onRemoveTargetImage,
  onSavePrediction,
  predictionNotes,
  selectedExercise,
  selectedPrediction,
  setPredictionNotes,
  updateCreateForm
}: {
  activeBlindCueConflict: boolean;
  activeUser: User;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  completedChecklistCount: number;
  creatorAccounts: User[];
  createForm: CreateFormState;
  createPreviewCloseTime: string;
  creationChecklist: Array<{ label: string; complete: boolean }>;
  formatDateTime: (value: string) => string;
  handlePointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  handlePointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  handlePointerUp: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  handleTargetImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearCanvas: () => void;
  onCreateExercise: (mode: "draft" | "publish") => void;
  onRemoveTargetImage: () => void;
  onSavePrediction: () => void;
  predictionNotes: string;
  selectedExercise: Exercise | null;
  selectedPrediction?: Prediction;
  setPredictionNotes: Dispatch<SetStateAction<string>>;
  updateCreateForm: (nextValue: CreateFormState | ((current: CreateFormState) => CreateFormState)) => void;
}) {
  if (!isCreatorRole(activeUser.role)) {
    return (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Prediction Pad</span>
            <h2>Draw and type your impression</h2>
          </div>
          <p>Sketch on the pad, add notes, and save a single prediction image record for the selected target.</p>
        </div>

        {selectedExercise ? (
          <>
            <div className="detail-card viewer-brief-card">
              <span>Session prompt</span>
              <strong>{selectedExercise.viewerPrompt || "Use the blind cue and your standard method."}</strong>
              <p>This prompt is creator-provided guidance that remains safe to see before the reveal opens.</p>
            </div>

            <div className="detail-grid">
              <div className="detail-card">
                <span>Selected target</span>
                <strong>{selectedExercise.title}</strong>
                <p>{selectedExercise.blindCue}</p>
              </div>
          <div className="detail-card">
            <span>Submission status</span>
            <strong>
              {selectedPrediction
                ? `Latest entry ${selectedPrediction.entryNumber}/${selectedExercise.maxEntriesPerViewer}`
                : `0/${selectedExercise.maxEntriesPerViewer} entries used`}
            </strong>
            <p>
              {selectedPrediction
                ? `Last saved ${formatDateTime(selectedPrediction.submittedAt)}`
                : "You can submit entries until the creator-set limit is reached."}
            </p>
          </div>
        </div>
          </>
        ) : (
          <div className="empty-card">
            <strong>No exercise selected</strong>
            <p>Open the exercise feed and choose a target before using the prediction pad.</p>
          </div>
        )}

        <canvas
          className="sketchpad"
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerLeave={handlePointerUp}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          ref={canvasRef}
          width={CANVAS_WIDTH}
        />

        <div className="composer-grid">
          <label className="field">
            <span>Written impressions</span>
            <textarea
              onChange={(event) => setPredictionNotes(event.target.value)}
              placeholder="Shapes, textures, emotions, movement, temperature, symbols..."
              value={predictionNotes}
            />
          </label>
          <div className="detail-card">
            <span>Prediction record</span>
            <strong>{selectedExercise ? selectedExercise.title : "Waiting for target selection"}</strong>
            <p>{selectedExercise ? "Saving will attach this sketch and note to the selected exercise." : "No target selected yet."}</p>
          </div>
        </div>

        <div className="action-row">
          <button className="button-primary" onClick={onSavePrediction} type="button">
            Save Prediction
          </button>
          <button className="button-secondary" onClick={onClearCanvas} type="button">
            Clear Pad
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{getWorkspaceLabel(activeUser.role)}</span>
          <h2>Open a new target</h2>
        </div>
        <p>Build the blind cue, add viewer-safe guidance, and attach a reveal package that opens on the schedule you choose.</p>
      </div>

      <div className="form-grid form-grid-2">
        <label className="field">
          <span>Exercise title</span>
          <input
            onChange={(event) => updateCreateForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Example: Signal Over Water"
            value={createForm.title}
          />
        </label>
        <label className="field">
          <span>Blind cue</span>
          <input
            onChange={(event) => updateCreateForm((current) => ({ ...current, blindCue: event.target.value }))}
            placeholder="Example: Target 503"
            value={createForm.blindCue}
          />
        </label>
      </div>

      <label className="field">
        <span>Viewer prompt</span>
        <textarea
          onChange={(event) => updateCreateForm((current) => ({ ...current, viewerPrompt: event.target.value }))}
          placeholder="Example: Start with shape, movement, temperature, then any symbolic impressions."
          value={createForm.viewerPrompt}
        />
      </label>

      <div className="form-grid form-grid-2">
        <label className="field">
          <span>Hidden target</span>
          <textarea
            onChange={(event) => updateCreateForm((current) => ({ ...current, hiddenTarget: event.target.value }))}
            placeholder="Describe the real target that stays hidden during the active session."
            value={createForm.hiddenTarget}
          />
        </label>
        <label className="field">
          <span>Reveal summary</span>
          <textarea
            onChange={(event) => updateCreateForm((current) => ({ ...current, revealSummary: event.target.value }))}
            placeholder="Short post-closure summary for the archive."
            value={createForm.revealSummary}
          />
        </label>
      </div>

      <div className="form-grid form-grid-2">
        <label className="field">
          <span>Live start time</span>
          <input
            onChange={(event) => updateCreateForm((current) => ({ ...current, startsAt: event.target.value }))}
            type="datetime-local"
            value={createForm.startsAt}
          />
        </label>
        <label className="field">
          <span>Duration in hours</span>
          <input
            max="168"
            min="1"
            onChange={(event) => updateCreateForm((current) => ({ ...current, durationHours: event.target.value }))}
            type="number"
            value={createForm.durationHours}
          />
        </label>
        <label className="field">
          <span>Entries per viewer</span>
          <input
            max="10"
            min="1"
            onChange={(event) => updateCreateForm((current) => ({ ...current, maxEntriesPerViewer: event.target.value }))}
            type="number"
            value={createForm.maxEntriesPerViewer}
          />
        </label>
        <label className="field">
          <span>Reveal timing</span>
          <select
            onChange={(event) =>
              updateCreateForm((current) => ({
                ...current,
                revealPolicy:
                  event.target.value === "on_completion" || event.target.value === "on_start"
                    ? event.target.value
                    : "on_expiry"
              }))
            }
            value={createForm.revealPolicy}
          >
            <option value="on_start">Reveal from start</option>
            <option value="on_expiry">Reveal on expiry</option>
            <option value="on_completion">Reveal when viewer completes entries</option>
          </select>
        </label>

        <div className="detail-card target-upload-card">
          <span>Reveal image</span>
          <strong>{createForm.targetImageName || "Optional target upload"}</strong>
          <p>Attach an image that stays hidden until the reveal timing unlocks it for viewers.</p>
          <input accept="image/*" onChange={handleTargetImageChange} type="file" />
          {createForm.targetImageData ? (
            <>
              <img alt="Draft target reveal preview" className="submission-image target-preview-image" src={createForm.targetImageData} />
              <button className="button-secondary" onClick={onRemoveTargetImage} type="button">
                Remove Image
              </button>
            </>
          ) : null}
        </div>
      </div>

      <label className="field">
        <span>Co-creators</span>
        <select
          multiple
          onChange={(event) =>
            updateCreateForm((current) => ({
              ...current,
              coCreatorIds: Array.from(event.target.selectedOptions, (option) => option.value)
            }))
          }
          value={createForm.coCreatorIds}
        >
          {creatorAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </label>

      <div className="form-grid form-grid-2">
        <div className="detail-card creator-status-card">
          <span>Publish checklist</span>
          <strong>
            {completedChecklistCount}/{creationChecklist.length} ready
          </strong>
          <div className="status-list">
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

        <div className="detail-card creator-status-card">
          <span>Exercise preview</span>
          <strong>{createForm.title.trim() || "Untitled exercise"}</strong>
          <p>{createForm.blindCue.trim() ? `Blind cue ${createForm.blindCue.trim()}` : "Add a blind cue viewers can see safely."}</p>
          <div className="status-list">
            <div className="status-row">
              <strong>Starts</strong>
              <span>{createForm.startsAt ? formatDateTime(createForm.startsAt) : "Not scheduled"}</span>
            </div>
            <div className="status-row">
              <strong>Closes</strong>
              <span>{createPreviewCloseTime}</span>
            </div>
            <div className="status-row">
              <strong>Reveal image</strong>
              <span>{createForm.targetImageData ? "Attached" : "Text-only reveal"}</span>
            </div>
            <div className="status-row">
              <strong>Blind cue status</strong>
              <span>{activeBlindCueConflict ? "Already active" : "Available"}</span>
            </div>
            <div className="status-row">
              <strong>Entry cap</strong>
              <span>{createForm.maxEntriesPerViewer || "1"} per viewer</span>
            </div>
          </div>
        </div>
      </div>

      <div className="action-row">
        <button className="button-secondary" onClick={() => onCreateExercise("draft")} type="button">
          Save Draft
        </button>
        <button className="button-primary" onClick={() => onCreateExercise("publish")} type="button">
          {createForm.exerciseId ? "Update Exercise" : "Publish Exercise"}
        </button>
      </div>
    </section>
  );
}
