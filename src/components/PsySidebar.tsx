import { NavLink } from "react-router-dom";
import { getRoleLabel, getWorkspaceLabel, type Exercise, type SidebarItem, type User } from "../psy/types";

export default function PsySidebar({
  activeUser,
  feedback,
  onLogout,
  selectedExercise,
  sidebarItems,
  isClosed
}: {
  activeUser: User;
  feedback: string;
  onLogout: () => void;
  selectedExercise: Exercise | null;
  sidebarItems: SidebarItem[];
  isClosed: (exercise: Exercise) => boolean;
}) {
  return (
    <aside className="sidebar-panel">
      <div className="sidebar-block">
        <span className="eyebrow">Navigate</span>
        <h2>{getWorkspaceLabel(activeUser.role)}</h2>
        <p>Move between the feed, active tools, and the delayed review archive.</p>
      </div>

      <nav aria-label="Sidebar navigation" className="sidebar-nav">
        {sidebarItems.map((item) => (
          <NavLink
            className={({ isActive }) => `sidebar-link${isActive ? " is-active" : ""}`}
            key={item.path}
            to={item.path}
          >
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-block sidebar-account-card">
        <span className="card-label">Active Account</span>
        <strong>{activeUser.name}</strong>
        <p>{activeUser.email}</p>
        <p>{getRoleLabel(activeUser.role)}</p>
        <button className="button-secondary" onClick={onLogout} type="button">
          Sign Out
        </button>
      </div>

      <div className="sidebar-block sidebar-feedback-card">
        <span className="card-label">Status</span>
        <strong>{feedback}</strong>
        <p>
          {selectedExercise
            ? `${selectedExercise.title} is ${isClosed(selectedExercise) ? "open for review" : "still blind"}.`
            : "Select an exercise to begin."}
        </p>
      </div>
    </aside>
  );
}
