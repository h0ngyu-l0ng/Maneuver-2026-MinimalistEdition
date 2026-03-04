export const SCOUT_ROLES = [
    "commentScouter",
    "dataScouter",
    "leadership",
    "mentors",
    "unlockLeaderboard",
]as const;

export type ScoutRole = typeof SCOUT_ROLES[number];