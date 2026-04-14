import Athlete from "../models/Athlete.js";
import Club from "../models/Club.js";
import Coach from "../models/Coach.js";
import CoachEvent from "../models/CoachEvent.js";
import PerformanceRating from "../models/PerformanceRating.js";
import Team from "../models/Team.js";

const EVENT_TYPES = new Set(["Match", "Friendly", "Tournament", "Training Camp", "Other"]);
const RESULT_TYPES = new Set(["Won", "Lost", "Draw", "—"]);

const clampRating = (value) => {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return Math.min(5, Math.max(0, numericValue));
};

const buildOverallScore = (scores = {}) => {
  const values = Object.values(scores).map(clampRating).filter((value) => value > 0);
  if (!values.length) {
    return 0;
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
};

const getCoachProfile = async (userId) =>
  Coach.findOne({ user: userId }).populate({
    path: "clubs",
    populate: { path: "admin", select: "name profilePic" },
  });

const getCoachTeams = async (coachUserId, coachProfile) => {
  const clubIds = (coachProfile?.clubs || []).map((club) => club._id || club);

  return Team.find({
    $or: [
      { coaches: coachUserId },
      { club: { $in: clubIds } },
    ],
  })
    .populate("club", "name profilePic admin")
    .populate("athletes", "name profilePic email")
    .sort({ updatedAt: -1, createdAt: -1 });
};

const sanitizeEventPayload = (body = {}) => ({
  title: String(body.title || "").trim().slice(0, 140),
  type: EVENT_TYPES.has(body.type) ? body.type : "Match",
  date: body.date ? new Date(body.date) : null,
  location: String(body.location || "").trim().slice(0, 160),
  opponent: String(body.opponent || "").trim().slice(0, 120),
  notes: String(body.notes || "").trim().slice(0, 600),
  result: RESULT_TYPES.has(body.result) ? body.result : "—",
});

const sanitizeScores = (scores = {}) => ({
  fitness: clampRating(scores.fitness),
  skill: clampRating(scores.skill),
  attitude: clampRating(scores.attitude),
  effort: clampRating(scores.effort),
  teamwork: clampRating(scores.teamwork),
});

const athleteCanAccessEvent = (event, athleteClubIds, athleteTeamIds) => {
  const eventClubId = event.club?._id?.toString?.() || event.club?.toString?.();
  const eventTeamId = event.team?._id?.toString?.() || event.team?.toString?.();

  if (eventTeamId && athleteTeamIds.has(eventTeamId)) {
    return true;
  }

  if (eventClubId && athleteClubIds.has(eventClubId)) {
    return true;
  }

  return false;
};

export const getCoachTeamsForTools = async (req, res) => {
  try {
    const coachProfile = await getCoachProfile(req.user.id);
    if (!coachProfile) {
      return res.status(404).json({ message: "Coach profile not found" });
    }

    const teams = await getCoachTeams(req.user.id, coachProfile);
    return res.status(200).json(teams);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCoachEvents = async (req, res) => {
  try {
    const events = await CoachEvent.find({ coach: req.user.id })
      .populate("club", "name profilePic")
      .populate("team", "name club")
      .sort({ date: 1, createdAt: -1 });

    return res.status(200).json(events);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createCoachEvent = async (req, res) => {
  try {
    const coachProfile = await getCoachProfile(req.user.id);
    if (!coachProfile) {
      return res.status(404).json({ message: "Coach profile not found" });
    }

    const eventPayload = sanitizeEventPayload(req.body);

    if (!eventPayload.title || !eventPayload.date || Number.isNaN(eventPayload.date.getTime())) {
      return res.status(400).json({ message: "Title and valid date are required" });
    }

    let team = null;
    let club = null;

    if (req.body.teamId) {
      team = await Team.findById(req.body.teamId).populate("club", "name");
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      const coachTeams = await getCoachTeams(req.user.id, coachProfile);
      const allowedTeamIds = new Set(coachTeams.map((entry) => entry._id.toString()));
      if (!allowedTeamIds.has(team._id.toString())) {
        return res.status(403).json({ message: "You can only create events for your own teams" });
      }

      club = team.club?._id || team.club || null;
    } else if (req.body.clubId) {
      const requestedClub = await Club.findById(req.body.clubId);
      if (!requestedClub) {
        return res.status(404).json({ message: "Club not found" });
      }

      const coachClubIds = new Set((coachProfile.clubs || []).map((entry) => entry._id.toString()));
      if (!coachClubIds.has(requestedClub._id.toString())) {
        return res.status(403).json({ message: "You can only create events for your own clubs" });
      }

      club = requestedClub._id;
    } else {
      club = coachProfile.clubs?.[0]?._id || null;
    }

    const event = await CoachEvent.create({
      coach: req.user.id,
      club,
      team: team?._id || null,
      ...eventPayload,
    });

    const populatedEvent = await CoachEvent.findById(event._id)
      .populate("club", "name profilePic")
      .populate("team", "name club");

    return res.status(201).json(populatedEvent);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateCoachEvent = async (req, res) => {
  try {
    const event = await CoachEvent.findOne({ _id: req.params.id, coach: req.user.id });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const eventPayload = sanitizeEventPayload(req.body);
    if (!eventPayload.title || !eventPayload.date || Number.isNaN(eventPayload.date.getTime())) {
      return res.status(400).json({ message: "Title and valid date are required" });
    }

    Object.assign(event, eventPayload);
    await event.save();

    const populatedEvent = await CoachEvent.findById(event._id)
      .populate("club", "name profilePic")
      .populate("team", "name club");

    return res.status(200).json(populatedEvent);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteCoachEvent = async (req, res) => {
  try {
    const event = await CoachEvent.findOneAndDelete({ _id: req.params.id, coach: req.user.id });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.status(200).json({ message: "Event deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCoachPerformanceRatings = async (req, res) => {
  try {
    const ratings = await PerformanceRating.find({ coach: req.user.id })
      .populate("athlete", "name profilePic email")
      .populate("team", "name")
      .sort({ updatedAt: -1, createdAt: -1 });

    return res.status(200).json(ratings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const savePerformanceRating = async (req, res) => {
  try {
    const athleteUserId = req.params.athleteUserId;
    const athleteProfile = await Athlete.findOne({ user: athleteUserId });
    if (!athleteProfile) {
      return res.status(404).json({ message: "Athlete not found" });
    }

    const coachProfile = await getCoachProfile(req.user.id);
    if (!coachProfile) {
      return res.status(404).json({ message: "Coach profile not found" });
    }

    const coachTeams = await getCoachTeams(req.user.id, coachProfile);
    const eligibleTeam = coachTeams.find((team) =>
      (team.athletes || []).some((athlete) => athlete._id.toString() === athleteUserId)
    );

    if (!eligibleTeam) {
      return res.status(403).json({ message: "You can only rate athletes in your teams" });
    }

    const scores = sanitizeScores(req.body.scores || {});
    const note = String(req.body.note || "").trim().slice(0, 1200);
    const overallScore = buildOverallScore(scores);

    const rating = await PerformanceRating.findOneAndUpdate(
      { coach: req.user.id, athlete: athleteUserId },
      {
        coach: req.user.id,
        athlete: athleteUserId,
        team: eligibleTeam._id,
        scores,
        note,
        overallScore,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    )
      .populate("athlete", "name profilePic email")
      .populate("coach", "name profilePic email")
      .populate("team", "name");

    return res.status(200).json(rating);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAthleteCoachEvents = async (req, res) => {
  try {
    const athleteProfile = await Athlete.findOne({ user: req.user.id });
    if (!athleteProfile) {
      return res.status(404).json({ message: "Athlete profile not found" });
    }

    const athleteClubIds = new Set((athleteProfile.clubs || []).map((clubId) => clubId.toString()));
    const teams = await Team.find({ athletes: req.user.id }).select("_id");
    const athleteTeamIds = new Set(teams.map((team) => team._id.toString()));

    const events = await CoachEvent.find({
      $or: [
        { club: { $in: [...athleteClubIds] } },
        { team: { $in: [...athleteTeamIds] } },
      ],
    })
      .populate("coach", "name profilePic")
      .populate("club", "name profilePic")
      .populate("team", "name")
      .sort({ date: 1, createdAt: -1 });

    const visibleEvents = events.filter((event) =>
      athleteCanAccessEvent(event, athleteClubIds, athleteTeamIds)
    );

    return res.status(200).json(visibleEvents);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAthletePerformanceRatings = async (req, res) => {
  try {
    const ratings = await PerformanceRating.find({ athlete: req.user.id })
      .populate("coach", "name profilePic email")
      .populate("team", "name")
      .sort({ updatedAt: -1, createdAt: -1 });

    return res.status(200).json(ratings);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
