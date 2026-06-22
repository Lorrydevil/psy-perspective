import type { Dispatch, SetStateAction } from "react";
import { getRoleLabel, type AccountFormState, type AccountSettings, type User } from "../../psy/types";

export default function AccountSettingsPage({
  accountCompletion,
  accountFeedback,
  accountForm,
  activeUser,
  activeUserSettings,
  onReset,
  onSave,
  setAccountForm
}: {
  accountCompletion: number;
  accountFeedback: string;
  accountForm: AccountFormState;
  activeUser: User;
  activeUserSettings: AccountSettings | null;
  onReset: () => void;
  onSave: () => void;
  setAccountForm: Dispatch<SetStateAction<AccountFormState>>;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Account Settings</span>
          <h2>Profile, password, and practice preferences</h2>
        </div>
        <p>Each account keeps its own shared settings so creators and viewers can tune their workspace across devices.</p>
      </div>

      <div className="detail-grid account-settings-grid">
        <div className="detail-card account-summary-card">
          <span>Profile completion</span>
          <strong>{accountCompletion}/4 ready</strong>
          <p>{accountFeedback}</p>
        </div>
        <div className="detail-card account-summary-card">
          <span>Current mode</span>
          <strong>{getRoleLabel(activeUser.role)}</strong>
          <p>Focus mode {activeUserSettings?.focusMode === "structured" ? "Structured workflow" : "Freeform flow"}</p>
        </div>
      </div>

      <div className="form-grid form-grid-2 account-settings-layout">
        <div className="stack-list">
          <label className="field">
            <span>Display name</span>
            <input
              onChange={(event) => {
                setAccountForm((current) => ({ ...current, name: event.target.value }));
              }}
              value={accountForm.name}
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              onChange={(event) => {
                setAccountForm((current) => ({ ...current, email: event.target.value }));
              }}
              type="email"
              value={accountForm.email}
            />
          </label>
          <div className="form-grid form-grid-2">
            <label className="field">
              <span>Password</span>
              <input
                onChange={(event) => {
                  setAccountForm((current) => ({ ...current, password: event.target.value }));
                }}
                type="password"
                value={accountForm.password}
              />
            </label>
            <label className="field">
              <span>Confirm password</span>
              <input
                onChange={(event) => {
                  setAccountForm((current) => ({ ...current, confirmPassword: event.target.value }));
                }}
                type="password"
                value={accountForm.confirmPassword}
              />
            </label>
          </div>
        </div>

        <div className="stack-list">
          <label className="field">
            <span>Community alias</span>
            <input
              onChange={(event) => {
                setAccountForm((current) => ({ ...current, communityAlias: event.target.value }));
              }}
              placeholder="Name shown in shared review spaces"
              value={accountForm.communityAlias}
            />
          </label>
          <label className="field">
            <span>Focus mode</span>
            <select
              onChange={(event) => {
                setAccountForm((current) => ({
                  ...current,
                  focusMode: event.target.value as AccountSettings["focusMode"]
                }));
              }}
              value={accountForm.focusMode}
            >
              <option value="freeform">Freeform</option>
              <option value="structured">Structured</option>
            </select>
          </label>
          <label className="field">
            <span>Profile note</span>
            <textarea
              onChange={(event) => {
                setAccountForm((current) => ({ ...current, profileNote: event.target.value }));
              }}
              placeholder="How you want to use this account in the practice archive."
              value={accountForm.profileNote}
            />
          </label>
          <label className="toggle-row">
            <input
              checked={accountForm.revealAlerts}
              onChange={(event) => {
                setAccountForm((current) => ({ ...current, revealAlerts: event.target.checked }));
              }}
              type="checkbox"
            />
            <span>Enable reveal alerts for closed sessions</span>
          </label>
        </div>
      </div>

      <div className="action-row">
        <button className="button-primary" onClick={onSave} type="button">
          Save Account Settings
        </button>
        <button className="button-secondary" onClick={onReset} type="button">
          Reset Form
        </button>
      </div>
    </section>
  );
}
