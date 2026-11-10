import React from "react";
import PlanApproval from "./PlanApproval.jsx";
import { db } from "../firebase";
import { fetchShare, decideShare } from "../planShare.js";

const loadShare = (token) => {
  if (!db) return Promise.reject(new Error("offline"));
  return fetchShare(db, token);
};
const submitDecision = (token, decision, name) => decideShare(db, token, decision, name);

export default function PlanApprovalRoute({ token }) {
  return <PlanApproval token={token} loadShare={loadShare} submitDecision={submitDecision} />;
}
