import TaskBoard from "../../components/TaskBoard";

export default function AthleteTasks() {
  return (
    <TaskBoard
      storageKey="an_tasks_athlete"
      role="athlete"
      eyebrow="My Dashboard"
      pageTitle="My Tasks"
      pageSubtitle="Track fitness goals, recovery routines, and competition prep — all in one place."
    />
  );
}
