import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CameraCapture, { cameraErrorMessage, cameraSupported } from "../src/components/CameraCapture.jsx";

const stream = () => ({ getTracks: () => [{ stop: vi.fn() }] });
afterEach(() => { delete navigator.mediaDevices; vi.restoreAllMocks(); });

describe("camera capture", () => {
  it("reports whether the browser has a camera API", () => {
    expect(cameraSupported()).toBe(false);
    Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: vi.fn() }, configurable: true });
    expect(cameraSupported()).toBe(true);
  });

  it("gives a plain-language message for each camera problem", () => {
    expect(cameraErrorMessage({ name: "NotAllowedError" })).toMatch(/blocked/);
    expect(cameraErrorMessage({ name: "NotFoundError" })).toMatch(/No camera/);
    expect(cameraErrorMessage({ name: "NotReadableError" })).toMatch(/another app/);
    expect(cameraErrorMessage(new Error("x"))).toMatch(/Could not start/);
  });

  it("shows the message and keeps Take picture off when access is refused", async () => {
    Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: vi.fn().mockRejectedValue({ name: "NotAllowedError" }), enumerateDevices: vi.fn() }, configurable: true });
    render(<CameraCapture onCapture={() => {}} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/blocked/));
    expect(screen.getByRole("button", { name: /Take picture/ }).disabled).toBe(true);
  });

  it("starts the camera, lists cameras to choose from and closes on Escape", async () => {
    const getUserMedia = vi.fn().mockResolvedValue(stream());
    const enumerateDevices = vi.fn().mockResolvedValue([{ kind: "videoinput", deviceId: "a", label: "Intraoral cam" }, { kind: "videoinput", deviceId: "b", label: "Laptop camera" }, { kind: "audioinput", deviceId: "c", label: "Mic" }]);
    Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia, enumerateDevices }, configurable: true });
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue();
    const onClose = vi.fn();
    render(<CameraCapture onCapture={() => {}} onClose={onClose} />);
    await waitFor(() => expect(screen.getByLabelText("Camera")).toBeTruthy());
    expect(screen.getByRole("option", { name: "Intraoral cam" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Mic" })).toBeNull();
    expect(getUserMedia.mock.calls[0][0].audio).toBe(false); // never asks for the microphone
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
