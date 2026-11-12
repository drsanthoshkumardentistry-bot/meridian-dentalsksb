import React from "react";
import PatientPortal from "./PatientPortal.jsx";
import { db } from "../firebase";
import { fetchPortal } from "../portalStore.js";

const loadPage = (token) => (db ? fetchPortal(db, token) : Promise.reject(new Error("offline")));

export default function PatientPortalRoute({ token }) {
  return <PatientPortal token={token} loadPage={loadPage} />;
}
