import Coach from "../models/Coach.js";
import Formation from "../models/Formation.js";

const clampPercent = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return 50;
  return Math.min(100, Math.max(0, Number(numericValue.toFixed(2))));
};

const sanitizePlayers = (players = []) =>
  players.map((player, index) => ({
    name: String(player?.name || `Player ${index + 1}`).trim().slice(0, 60),
    role: String(player?.role || "").trim().slice(0, 60),
    x: clampPercent(player?.x),
    y: clampPercent(player?.y),
    instructions: String(player?.instructions || "").trim().slice(0, 500),
  }));

const sanitizeFormationPayload = (body = {}) => ({
  sportType: body?.sportType,
  presetKey: String(body?.presetKey || "").trim().slice(0, 60),
  name: String(body?.name || "Untitled Formation").trim().slice(0, 120),
  teamId: body?.teamId || undefined,
  modes: {
    attack: sanitizePlayers(body?.modes?.attack),
    defense: sanitizePlayers(body?.modes?.defense),
  },
});

const populateOpts = {
  path: "coachId",
  populate: { path: "user", select: "name email profilePic role" },
};

const getCoachProfileForUser = async (userId) => Coach.findOne({ user: userId });

const resolveCoachIdParam = async (coachIdParam, reqUser) => {
  if (coachIdParam === "me" && reqUser?.role === "coach") {
    const coachProfile = await getCoachProfileForUser(reqUser._id);
    return coachProfile?._id || null;
  }
  const coachByProfileId = await Coach.findById(coachIdParam);
  if (coachByProfileId) return coachByProfileId._id;
  const coachByUserId = await Coach.findOne({ user: coachIdParam });
  return coachByUserId?._id || null;
};

// ── CRUD ──────────────────────────────────────────────────────────────────────

export const createFormation = async (req, res) => {
  try {
    const coachProfile = await getCoachProfileForUser(req.user.id);
    if (!coachProfile) return res.status(404).json({ message: "Coach profile not found" });

    const formation = await Formation.create({
      coachId: coachProfile._id,
      ...sanitizeFormationPayload(req.body),
    });

    const populated = await Formation.findById(formation._id).populate(populateOpts);
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getFormationsByCoachId = async (req, res) => {
  try {
    const resolvedCoachId = await resolveCoachIdParam(req.params.coachId, req.user);
    if (!resolvedCoachId) return res.status(404).json({ message: "Coach profile not found" });

    const formations = await Formation.find({ coachId: resolvedCoachId })
      .populate(populateOpts)
      .sort({ updatedAt: -1 });

    return res.status(200).json(formations);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getFormationsByTeam = async (req, res) => {
  try {
    const formations = await Formation.find({ teamId: req.params.teamId })
      .populate(populateOpts)
      .populate("comments.user", "name profilePic role")
      .sort({ updatedAt: -1 });
    return res.status(200).json(formations);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getFormationById = async (req, res) => {
  try {
    const formation = await Formation.findById(req.params.id)
      .populate(populateOpts)
      .populate("comments.user", "name profilePic role");
    if (!formation) return res.status(404).json({ message: "Formation not found" });
    return res.status(200).json(formation);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateFormation = async (req, res) => {
  try {
    const coachProfile = await getCoachProfileForUser(req.user.id);
    if (!coachProfile) return res.status(404).json({ message: "Coach profile not found" });

    const existing = await Formation.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Formation not found" });
    if (String(existing.coachId) !== String(coachProfile._id))
      return res.status(403).json({ message: "You can only update your own formations" });

    const updated = await Formation.findByIdAndUpdate(
      req.params.id,
      sanitizeFormationPayload(req.body),
      { new: true, runValidators: true }
    ).populate(populateOpts);

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteFormation = async (req, res) => {
  try {
    const coachProfile = await getCoachProfileForUser(req.user.id);
    if (!coachProfile) return res.status(404).json({ message: "Coach profile not found" });

    const formation = await Formation.findById(req.params.id);
    if (!formation) return res.status(404).json({ message: "Formation not found" });
    if (String(formation.coachId) !== String(coachProfile._id))
      return res.status(403).json({ message: "You can only delete your own formations" });

    await formation.deleteOne();
    return res.status(200).json({ message: "Formation deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ── COMMENTS ──────────────────────────────────────────────────────────────────

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || String(text).trim().length === 0)
      return res.status(400).json({ message: "Comment text is required" });

    const formation = await Formation.findById(req.params.id);
    if (!formation) return res.status(404).json({ message: "Formation not found" });

    formation.comments.push({ user: req.user.id, text: String(text).trim().slice(0, 1000) });
    await formation.save();

    const updated = await Formation.findById(req.params.id)
      .populate("comments.user", "name profilePic role");

    const newComment = updated.comments[updated.comments.length - 1];
    return res.status(201).json(newComment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const formation = await Formation.findById(req.params.id)
      .select("comments")
      .populate("comments.user", "name profilePic role");
    if (!formation) return res.status(404).json({ message: "Formation not found" });
    return res.status(200).json(formation.comments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const formation = await Formation.findById(req.params.id);
    if (!formation) return res.status(404).json({ message: "Formation not found" });

    const comment = formation.comments.id(req.params.cId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (String(comment.user) !== String(req.user.id))
      return res.status(403).json({ message: "You can only delete your own comments" });

    comment.deleteOne();
    await formation.save();
    return res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
