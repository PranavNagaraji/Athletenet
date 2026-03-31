import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage    from "./pages/AuthPage";
import HomePage    from "./pages/HomePage";
import AuthRoute   from "./routes/AuthRoute";
import PublicRoute from "./routes/PublicRoute";

// Club pages
import ClubLayout       from "./pages/club/ClubLayout";
import ClubDashboard    from "./pages/club/ClubDashboard";
import ClubProfile      from "./pages/club/ClubProfile";
import ClubMembers      from "./pages/club/ClubMembers";
import ClubJoinRequests from "./pages/club/ClubJoinRequests";
import ClubTeams        from "./pages/club/ClubTeams";
import ClubPlaygrounds  from "./pages/club/ClubPlaygrounds";
import ClubCompetitions from "./pages/club/ClubCompetitions";
import ClubTalent       from "./pages/club/ClubTalent";
import ClubBookings     from "./pages/club/ClubBookings";
import ClubChat         from "./pages/club/ClubChat";
import ClubFeed         from "./pages/club/ClubFeed";

// Athlete pages
import AthleteLayout    from "./pages/athlete/AthleteLayout";
import AthleteDashboard from "./pages/athlete/AthleteDashboard";
import AthleteProfile   from "./pages/athlete/AthleteProfile";
import AthleteClubs     from "./pages/athlete/AthleteClubs";
import AthleteRequests  from "./pages/athlete/AthleteRequests";
import AthleteTeams       from "./pages/athlete/AthleteTeams";
import AthletePlaygrounds from "./pages/athlete/AthletePlaygrounds";
import AthleteBookings    from "./pages/athlete/AthleteBookings";
import AthleteChat        from "./pages/athlete/AthleteChat";
import AthleteFeed        from "./pages/athlete/AthleteFeed";
import AthleteTournaments from "./pages/athlete/AthleteTournaments";
import ClubTournaments    from "./pages/club/ClubTournaments";

// Coach pages
import CoachLayout      from "./pages/coach/CoachLayout";
import CoachDashboard   from "./pages/coach/CoachDashboard";
import CoachProfile     from "./pages/coach/CoachProfile";
import CoachClubs       from "./pages/coach/CoachClubs";
import CoachTeams       from "./pages/coach/CoachTeams";
import CoachRequests    from "./pages/coach/CoachRequests";

export default function App() {
  return (
    <Routes>
      {/* ── Public (unauthenticated only) ── */}
      <Route element={<PublicRoute />}>
        <Route path="/login"  element={<AuthPage defaultMode="login"  />} />
        <Route path="/signup" element={<AuthPage defaultMode="signup" />} />
      </Route>

      {/* ── Protected (any authenticated user) ── */}
      <Route element={<AuthRoute />}>
        <Route path="/home" element={<HomePage />} />

        {/* Club dashboard – nested under sidebar layout */}
        <Route path="/club" element={<ClubLayout />}>
          <Route index element={<Navigate to="/club/feed" replace />} />
          <Route path="dashboard"    element={<ClubDashboard    />} />
          <Route path="profile"      element={<ClubProfile      />} />
          <Route path="members"      element={<ClubMembers      />} />
          <Route path="join-requests"element={<ClubJoinRequests />} />
          <Route path="teams"        element={<ClubTeams        />} />
          <Route path="playgrounds"  element={<ClubPlaygrounds  />} />
          <Route path="bookings"     element={<ClubBookings     />} />
          <Route path="tournaments" element={<ClubTournaments />} />
          <Route path="talent"       element={<ClubTalent       />} />
          <Route path="chat"         element={<ClubChat         />} />
          <Route path="feed"         element={<ClubFeed         />} />
        </Route>

        {/* Athlete dashboard – nested under sidebar layout */}
        <Route path="/athlete" element={<AthleteLayout />}>
          <Route index element={<Navigate to="/athlete/feed" replace />} />
          <Route path="dashboard" element={<AthleteDashboard />} />
          <Route path="profile"   element={<AthleteProfile   />} />
          <Route path="clubs"       element={<AthleteClubs       />} />
          <Route path="teams"       element={<AthleteTeams       />} />
          <Route path="requests"    element={<AthleteRequests    />} />
          <Route path="playgrounds" element={<AthletePlaygrounds />} />
          <Route path="bookings"    element={<AthleteBookings    />} />
          <Route path="feed"        element={<AthleteFeed        />} />
          <Route path="tournaments" element={<AthleteTournaments />} />
        </Route>

        {/* Coach dashboard – nested under sidebar layout */}
        <Route path="/coach" element={<CoachLayout />}>
          <Route index element={<Navigate to="/coach/profile" replace />} />
          <Route path="dashboard" element={<CoachDashboard />} />
          <Route path="profile"   element={<CoachProfile   />} />
          <Route path="clubs"     element={<CoachClubs     />} />
          <Route path="teams"     element={<CoachTeams     />} />
          <Route path="requests"  element={<CoachRequests  />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
