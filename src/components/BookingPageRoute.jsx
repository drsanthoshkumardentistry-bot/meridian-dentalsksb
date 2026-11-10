import React from "react";
import BookingPage from "./BookingPage.jsx";
import { db } from "../firebase";
import { fetchBookingPage, submitBookingRequest } from "../bookingStore.js";

const loadPage = (id) => (db ? fetchBookingPage(db, id) : Promise.reject(new Error("offline")));
const newRequestId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const submit = (data) => submitBookingRequest(db, newRequestId(), data);

export default function BookingPageRoute({ clinicId }) {
  return <BookingPage clinicId={clinicId} loadPage={loadPage} submit={submit} />;
}
