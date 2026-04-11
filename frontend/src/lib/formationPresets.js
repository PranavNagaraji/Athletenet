let localPlayerSeed = 0;
let localFormationSeed = 0;

export const SPORT_META = {
  football: {
    label: "Football",
    surfaceLabel: "Tactical Pitch",
    aspectRatio: "1.58 / 1",
    accent: "#22c55e",
  },
  basketball: {
    label: "Basketball",
    surfaceLabel: "Half-Court Board",
    aspectRatio: "1.78 / 1",
    accent: "#f97316",
  },
  cricket: {
    label: "Cricket",
    surfaceLabel: "Fielding Map",
    aspectRatio: "1.55 / 1",
    accent: "#38bdf8",
  },
};

const createLocalPlayerId = () => {
  localPlayerSeed += 1;
  return `player-${localPlayerSeed}`;
};

const createDraftFormationId = () => {
  localFormationSeed += 1;
  return `draft-${localFormationSeed}`;
};

const clonePlayers = (players = []) =>
  players.map((player, index) => ({
    id: createLocalPlayerId(),
    name: player.name || player.role || `Player ${index + 1}`,
    role: player.role || "",
    x: Number(player.x),
    y: Number(player.y),
    instructions: player.instructions || "",
  }));

const PRESET_LIBRARY = {
  football: [
    {
      key: "433",
      label: "4-3-3 Press",
      defaultName: "4-3-3 Press",
      attack: [
        { name: "GK", role: "Goalkeeper", x: 50, y: 92 },
        { name: "LB", role: "Left Back", x: 18, y: 73 },
        { name: "LCB", role: "Center Back", x: 37, y: 77 },
        { name: "RCB", role: "Center Back", x: 63, y: 77 },
        { name: "RB", role: "Right Back", x: 82, y: 73 },
        { name: "LCM", role: "Midfielder", x: 30, y: 56 },
        { name: "CM", role: "Holding Mid", x: 50, y: 61 },
        { name: "RCM", role: "Midfielder", x: 70, y: 56 },
        { name: "LW", role: "Left Wing", x: 22, y: 28 },
        { name: "ST", role: "Striker", x: 50, y: 22 },
        { name: "RW", role: "Right Wing", x: 78, y: 28 },
      ],
      defense: [
        { name: "GK", role: "Goalkeeper", x: 50, y: 92 },
        { name: "LB", role: "Left Back", x: 21, y: 80 },
        { name: "LCB", role: "Center Back", x: 40, y: 82 },
        { name: "RCB", role: "Center Back", x: 60, y: 82 },
        { name: "RB", role: "Right Back", x: 79, y: 80 },
        { name: "LM", role: "Wide Mid", x: 22, y: 59 },
        { name: "LCM", role: "Midfielder", x: 39, y: 62 },
        { name: "CM", role: "Holding Mid", x: 50, y: 67 },
        { name: "RCM", role: "Midfielder", x: 61, y: 62 },
        { name: "RM", role: "Wide Mid", x: 78, y: 59 },
        { name: "ST", role: "Outlet", x: 50, y: 39 },
      ],
    },
    {
      key: "442",
      label: "4-4-2 Block",
      defaultName: "4-4-2 Block",
      attack: [
        { name: "GK", role: "Goalkeeper", x: 50, y: 92 },
        { name: "LB", role: "Left Back", x: 18, y: 74 },
        { name: "LCB", role: "Center Back", x: 38, y: 78 },
        { name: "RCB", role: "Center Back", x: 62, y: 78 },
        { name: "RB", role: "Right Back", x: 82, y: 74 },
        { name: "LM", role: "Wide Mid", x: 18, y: 50 },
        { name: "LCM", role: "Midfielder", x: 39, y: 54 },
        { name: "RCM", role: "Midfielder", x: 61, y: 54 },
        { name: "RM", role: "Wide Mid", x: 82, y: 50 },
        { name: "LS", role: "Striker", x: 40, y: 26 },
        { name: "RS", role: "Striker", x: 60, y: 26 },
      ],
      defense: [
        { name: "GK", role: "Goalkeeper", x: 50, y: 92 },
        { name: "LB", role: "Left Back", x: 20, y: 81 },
        { name: "LCB", role: "Center Back", x: 40, y: 83 },
        { name: "RCB", role: "Center Back", x: 60, y: 83 },
        { name: "RB", role: "Right Back", x: 80, y: 81 },
        { name: "LM", role: "Wide Mid", x: 19, y: 61 },
        { name: "LCM", role: "Midfielder", x: 40, y: 64 },
        { name: "RCM", role: "Midfielder", x: 60, y: 64 },
        { name: "RM", role: "Wide Mid", x: 81, y: 61 },
        { name: "LS", role: "Front Press", x: 43, y: 41 },
        { name: "RS", role: "Front Press", x: 57, y: 41 },
      ],
    },
    {
      key: "352",
      label: "3-5-2 Control",
      defaultName: "3-5-2 Control",
      attack: [
        { name: "GK", role: "Goalkeeper", x: 50, y: 92 },
        { name: "LCB", role: "Center Back", x: 31, y: 77 },
        { name: "CB", role: "Sweeper", x: 50, y: 81 },
        { name: "RCB", role: "Center Back", x: 69, y: 77 },
        { name: "LWB", role: "Wing Back", x: 14, y: 47 },
        { name: "LCM", role: "Midfielder", x: 35, y: 55 },
        { name: "CM", role: "Anchor", x: 50, y: 60 },
        { name: "RCM", role: "Midfielder", x: 65, y: 55 },
        { name: "RWB", role: "Wing Back", x: 86, y: 47 },
        { name: "LS", role: "Striker", x: 40, y: 25 },
        { name: "RS", role: "Striker", x: 60, y: 25 },
      ],
      defense: [
        { name: "GK", role: "Goalkeeper", x: 50, y: 92 },
        { name: "LCB", role: "Center Back", x: 31, y: 81 },
        { name: "CB", role: "Sweeper", x: 50, y: 84 },
        { name: "RCB", role: "Center Back", x: 69, y: 81 },
        { name: "LWB", role: "Wing Back", x: 17, y: 62 },
        { name: "LCM", role: "Midfielder", x: 36, y: 64 },
        { name: "CM", role: "Anchor", x: 50, y: 68 },
        { name: "RCM", role: "Midfielder", x: 64, y: 64 },
        { name: "RWB", role: "Wing Back", x: 83, y: 62 },
        { name: "LS", role: "Outlet", x: 43, y: 43 },
        { name: "RS", role: "Outlet", x: 57, y: 43 },
      ],
    },
  ],
  basketball: [
    {
      key: "23-zone",
      label: "2-3 Zone",
      defaultName: "2-3 Zone",
      attack: [
        { name: "PG", role: "Point Guard", x: 50, y: 76 },
        { name: "SG", role: "Wing", x: 26, y: 58 },
        { name: "SF", role: "Wing", x: 74, y: 58 },
        { name: "PF", role: "Forward", x: 36, y: 34 },
        { name: "C", role: "Center", x: 64, y: 28 },
      ],
      defense: [
        { name: "G1", role: "Top Guard", x: 40, y: 58 },
        { name: "G2", role: "Top Guard", x: 60, y: 58 },
        { name: "F1", role: "Wing", x: 25, y: 39 },
        { name: "F2", role: "Wing", x: 75, y: 39 },
        { name: "C", role: "Rim Protector", x: 50, y: 23 },
      ],
    },
    {
      key: "3out2in",
      label: "3-Out 2-In",
      defaultName: "3-Out 2-In Motion",
      attack: [
        { name: "PG", role: "Point Guard", x: 50, y: 76 },
        { name: "LW", role: "Left Wing", x: 25, y: 60 },
        { name: "RW", role: "Right Wing", x: 75, y: 60 },
        { name: "LH", role: "High Post", x: 39, y: 37 },
        { name: "RH", role: "High Post", x: 61, y: 37 },
      ],
      defense: [
        { name: "PG", role: "Ball Pressure", x: 50, y: 61 },
        { name: "LW", role: "Gap Help", x: 28, y: 50 },
        { name: "RW", role: "Gap Help", x: 72, y: 50 },
        { name: "LH", role: "Paint Help", x: 39, y: 27 },
        { name: "RH", role: "Paint Help", x: 61, y: 27 },
      ],
    },
    {
      key: "131",
      label: "1-3-1 Trap",
      defaultName: "1-3-1 Trap",
      attack: [
        { name: "PG", role: "Point Guard", x: 50, y: 78 },
        { name: "LW", role: "Corner", x: 18, y: 52 },
        { name: "SF", role: "High Wing", x: 50, y: 54 },
        { name: "RW", role: "Corner", x: 82, y: 52 },
        { name: "C", role: "Baseline", x: 50, y: 23 },
      ],
      defense: [
        { name: "1", role: "Top", x: 50, y: 64 },
        { name: "2", role: "Left Wing", x: 26, y: 47 },
        { name: "3", role: "Middle", x: 50, y: 42 },
        { name: "4", role: "Right Wing", x: 74, y: 47 },
        { name: "5", role: "Baseline", x: 50, y: 22 },
      ],
    },
  ],
  cricket: [
    {
      key: "powerplay",
      label: "Powerplay Ring",
      defaultName: "Powerplay Ring",
      attack: [
        { name: "Bowler", role: "Bowler", x: 50, y: 59 },
        { name: "Keeper", role: "Wicket Keeper", x: 50, y: 18 },
        { name: "Slip", role: "Slip", x: 40, y: 12 },
        { name: "Gully", role: "Gully", x: 28, y: 18 },
        { name: "Point", role: "Point", x: 18, y: 34 },
        { name: "Cover", role: "Cover", x: 27, y: 52 },
        { name: "Mid-Off", role: "Mid Off", x: 40, y: 68 },
        { name: "Mid-On", role: "Mid On", x: 61, y: 68 },
        { name: "Square", role: "Square Leg", x: 80, y: 36 },
        { name: "Fine", role: "Fine Leg", x: 74, y: 19 },
        { name: "Third", role: "Third Man", x: 21, y: 11 },
      ],
      defense: [
        { name: "Bowler", role: "Bowler", x: 50, y: 59 },
        { name: "Keeper", role: "Wicket Keeper", x: 50, y: 18 },
        { name: "Slip", role: "Slip", x: 42, y: 12 },
        { name: "Point", role: "Deep Point", x: 13, y: 31 },
        { name: "Cover", role: "Deep Cover", x: 20, y: 59 },
        { name: "Mid-Off", role: "Mid Off", x: 39, y: 72 },
        { name: "Long-Off", role: "Boundary", x: 34, y: 87 },
        { name: "Long-On", role: "Boundary", x: 66, y: 87 },
        { name: "Mid-On", role: "Mid On", x: 61, y: 72 },
        { name: "Square", role: "Deep Square", x: 88, y: 36 },
        { name: "Fine", role: "Fine Leg", x: 78, y: 15 },
      ],
    },
    {
      key: "balanced-field",
      label: "Balanced Field",
      defaultName: "Balanced Field",
      attack: [
        { name: "Bowler", role: "Bowler", x: 50, y: 59 },
        { name: "Keeper", role: "Wicket Keeper", x: 50, y: 18 },
        { name: "Slip", role: "Slip", x: 41, y: 11 },
        { name: "Point", role: "Point", x: 18, y: 33 },
        { name: "Cover", role: "Extra Cover", x: 24, y: 57 },
        { name: "Mid-Off", role: "Mid Off", x: 39, y: 71 },
        { name: "Mid-On", role: "Mid On", x: 61, y: 71 },
        { name: "Square", role: "Square Leg", x: 82, y: 38 },
        { name: "Fine", role: "Fine Leg", x: 73, y: 19 },
        { name: "Third", role: "Third Man", x: 20, y: 12 },
        { name: "Long", role: "Long Leg", x: 86, y: 11 },
      ],
      defense: [
        { name: "Bowler", role: "Bowler", x: 50, y: 59 },
        { name: "Keeper", role: "Wicket Keeper", x: 50, y: 18 },
        { name: "Slip", role: "Fly Slip", x: 38, y: 10 },
        { name: "Point", role: "Deep Point", x: 9, y: 33 },
        { name: "Cover", role: "Sweeper Cover", x: 18, y: 62 },
        { name: "Mid-Off", role: "Mid Off", x: 40, y: 72 },
        { name: "Long-Off", role: "Long Off", x: 34, y: 89 },
        { name: "Long-On", role: "Long On", x: 66, y: 89 },
        { name: "Mid-On", role: "Mid On", x: 60, y: 72 },
        { name: "Square", role: "Deep Square", x: 91, y: 39 },
        { name: "Fine", role: "Deep Fine", x: 82, y: 10 },
      ],
    },
    {
      key: "death-overs",
      label: "Death Overs",
      defaultName: "Death Overs",
      attack: [
        { name: "Bowler", role: "Bowler", x: 50, y: 59 },
        { name: "Keeper", role: "Wicket Keeper", x: 50, y: 18 },
        { name: "Slip", role: "Fine Third", x: 25, y: 11 },
        { name: "Point", role: "Deep Point", x: 8, y: 34 },
        { name: "Cover", role: "Deep Cover", x: 18, y: 67 },
        { name: "Long-Off", role: "Long Off", x: 36, y: 89 },
        { name: "Long-On", role: "Long On", x: 64, y: 89 },
        { name: "Mid-Wicket", role: "Deep Mid-Wicket", x: 88, y: 55 },
        { name: "Square", role: "Deep Square", x: 92, y: 35 },
        { name: "Fine", role: "Deep Fine Leg", x: 82, y: 11 },
        { name: "Mid-Off", role: "Short Cover", x: 36, y: 62 },
      ],
      defense: [
        { name: "Bowler", role: "Bowler", x: 50, y: 59 },
        { name: "Keeper", role: "Wicket Keeper", x: 50, y: 18 },
        { name: "Slip", role: "Third Man", x: 22, y: 10 },
        { name: "Point", role: "Deep Backward Point", x: 8, y: 26 },
        { name: "Cover", role: "Sweeper", x: 16, y: 62 },
        { name: "Long-Off", role: "Long Off", x: 34, y: 90 },
        { name: "Long-On", role: "Long On", x: 66, y: 90 },
        { name: "Mid-Wicket", role: "Deep Mid-Wicket", x: 90, y: 58 },
        { name: "Square", role: "Deep Square Leg", x: 92, y: 34 },
        { name: "Fine", role: "Fine Leg", x: 82, y: 9 },
        { name: "Mid-On", role: "Catcher", x: 64, y: 69 },
      ],
    },
  ],
};

export const SPORT_OPTIONS = Object.entries(SPORT_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export const getSportMeta = (sportType) => SPORT_META[sportType] || SPORT_META.football;

export const getPresetOptions = (sportType) =>
  (PRESET_LIBRARY[sportType] || []).map((preset) => ({
    key: preset.key,
    label: preset.label,
  }));

const getPreset = (sportType, presetKey) => {
  const sportPresets = PRESET_LIBRARY[sportType] || PRESET_LIBRARY.football;
  return sportPresets.find((preset) => preset.key === presetKey) || sportPresets[0];
};

export const getPlayerId = (player) => String(player?.id || player?._id || "");

export const hydrateFormation = (formation) => ({
  ...formation,
  isDraft: false,
  presetKey: formation?.presetKey || getPreset(formation?.sportType || "football")?.key,
  modes: {
    attack: clonePlayers(formation?.modes?.attack || []),
    defense: clonePlayers(formation?.modes?.defense || []),
  },
});

export const createFormationDraft = (sportType = "football", presetKey) => {
  const preset = getPreset(sportType, presetKey);

  return {
    _id: createDraftFormationId(),
    isDraft: true,
    sportType,
    name: preset.defaultName,
    presetKey: preset.key,
    modes: {
      attack: clonePlayers(preset.attack),
      defense: clonePlayers(preset.defense),
    },
  };
};

export const applyPresetToFormation = (formation, sportType, presetKey) => {
  const preset = getPreset(sportType, presetKey);

  return {
    ...formation,
    sportType,
    presetKey: preset.key,
    name: formation?.name?.trim() ? formation.name : preset.defaultName,
    modes: {
      attack: clonePlayers(preset.attack),
      defense: clonePlayers(preset.defense),
    },
  };
};

export const serializeFormation = (formation) => ({
  name: String(formation?.name || "Untitled Formation").trim(),
  sportType: formation?.sportType || "football",
  modes: {
    attack: (formation?.modes?.attack || []).map((player) => ({
      name: String(player?.name || "").trim(),
      role: String(player?.role || "").trim(),
      x: Number(player?.x),
      y: Number(player?.y),
      instructions: String(player?.instructions || "").trim(),
    })),
    defense: (formation?.modes?.defense || []).map((player) => ({
      name: String(player?.name || "").trim(),
      role: String(player?.role || "").trim(),
      x: Number(player?.x),
      y: Number(player?.y),
      instructions: String(player?.instructions || "").trim(),
    })),
  },
});
