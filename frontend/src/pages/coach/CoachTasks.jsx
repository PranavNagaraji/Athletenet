import TaskBoard from "../../components/TaskBoard";

export default function CoachTasks() {
  return (
    <TaskBoard
      storageKey="an_tasks_coach"
      role="coach"
      eyebrow="Coaching Tools"
      pageTitle="My Tasks"
      pageSubtitle="Plan sessions, scout players, handle admin — keep everything on track."
    />
  );
}
