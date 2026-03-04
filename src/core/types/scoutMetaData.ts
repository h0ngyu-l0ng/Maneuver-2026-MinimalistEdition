import { ScoutRole } from "@/core/types/scoutRole";

export interface ScoutMetaData {
label: string;
}

export const ROLE_LABELS: Record<ScoutRole, ScoutMetaData> = {
  commentScouter: {
    label:"Comment Scouter"},
  
  dataScouter: {
    label:"Data Scouter"},
    
  leadership: {
    label:"Leadership"},

  mentors: {
    label:"Mentor"},

  unlockLeaderboard: {
    label:"Leaderboard Access"},
}
