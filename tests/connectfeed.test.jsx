import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import ConnectFeed, { ReportsQueue } from "../src/components/ConnectFeed.jsx";

afterEach(() => cleanup());
const me = { id: "me", fullName: "Dr Me", qualification: "BDS", specialty: "general" };
const post = (o = {}) => ({ id: "p1", authorId: "other", authorName: "Dr Root", authorQualification: "MDS", authorSpecialty: "endodontics", type: "case", title: "Abscess after RCT", body: "Recurrent swelling in 46 after obturation.", likeCount: 2, commentCount: 1, createdAt: Date.now() - 3600000, ...o });
const makeApi = (o = {}) => ({
  uid: "me",
  listPosts: vi.fn(async () => ({ posts: [post()], cursor: null })),
  likedSet: vi.fn(async () => new Set()), followingSet: vi.fn(async () => new Set()),
  createPost: vi.fn(async () => "n1"), deletePost: vi.fn(async () => {}), setLike: vi.fn(async () => {}), setFollow: vi.fn(async () => {}),
  listComments: vi.fn(async () => []), addComment: vi.fn(async () => {}), deleteComment: vi.fn(async () => {}),
  report: vi.fn(async () => {}), listReports: vi.fn(async () => []), getPost: vi.fn(async () => null), dismissReport: vi.fn(async () => {}),
  ...o,
});
const mount = (api, admin = false, toast = vi.fn()) => render(<ConnectFeed api={api} me={me} admin={admin} showToast={toast} />);

describe("MeriDent Connect network feed", () => {
  it("shows posts with the verified author and likes with a count", async () => {
    const api = makeApi();
    mount(api);
    expect(await screen.findByText("Abscess after RCT")).toBeTruthy();
    expect(screen.getByText("Dr Root")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Helpful, 2"));
    expect(await screen.findByLabelText("Helpful, 3")).toBeTruthy();
    expect(api.setLike).toHaveBeenCalledWith("p1", true);
  });

  it("follows an author", async () => {
    const api = makeApi();
    mount(api);
    fireEvent.click(await screen.findByText("Follow"));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Following$/, pressed: true })).toBeTruthy());
    expect(api.setFollow).toHaveBeenCalledWith("other", true);
  });

  it("refuses a case post until the patient is de-identified, and blocks phone numbers", async () => {
    const api = makeApi();
    mount(api);
    fireEvent.click(await screen.findByText(/Start a discussion/));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Swelling in 36" } });
    fireEvent.change(screen.getByLabelText("Details"), { target: { value: "Call the patient on 9876543210 please" } });
    fireEvent.click(screen.getByText("Post"));
    expect((await screen.findByRole("alert")).textContent).toBeTruthy();
    expect(api.createPost).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Details"), { target: { value: "Female, 34, swelling in 36 for two days, no fever." } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText("Post"));
    await waitFor(() => expect(api.createPost).toHaveBeenCalledTimes(1));
    expect(api.createPost.mock.calls[0][0].authorName).toBe("Dr Me");
  });

  it("opens a discussion and adds a comment", async () => {
    const api = makeApi();
    mount(api);
    fireEvent.click(await screen.findByText(/Discuss/));
    const box = await screen.findByLabelText("Comment on Abscess after RCT");
    fireEvent.change(box, { target: { value: "Check for a missed canal." } });
    fireEvent.click(screen.getByText("Comment"));
    await waitFor(() => expect(api.addComment).toHaveBeenCalledWith("p1", me, "Check for a missed canal."));
  });

  it("reports a post and lets authors delete their own", async () => {
    const api = makeApi({ listPosts: vi.fn(async () => ({ posts: [post(), post({ id: "p2", authorId: "me", authorName: "Dr Me", title: "My tip", type: "update" })], cursor: null })) });
    const toast = vi.fn();
    mount(api, false, toast);
    await screen.findByText("My tip");
    fireEvent.click(screen.getByText("Report"));
    fireEvent.click(screen.getByText("Spam or advertising"));
    await waitFor(() => expect(api.report).toHaveBeenCalledWith({ postId: "p1", reason: "Spam or advertising" }));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(api.deletePost).toHaveBeenCalledWith("p2"));
  });

  it("shows an error with retry when loading fails, and an empty state", async () => {
    const listPosts = vi.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValue({ posts: [], cursor: null });
    mount(makeApi({ listPosts }));
    fireEvent.click(await screen.findByText("try again"));
    expect(await screen.findByText(/No posts yet/)).toBeTruthy();
  });

  it("admin reports queue removes a reported post", async () => {
    const api = makeApi({ listReports: vi.fn(async () => [{ id: "r1", postId: "p1", reason: "Spam or advertising" }]), getPost: vi.fn(async () => post()) });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ReportsQueue api={api} showToast={vi.fn()} />);
    fireEvent.click(await screen.findByText("Remove post"));
    await waitFor(() => expect(api.deletePost).toHaveBeenCalledWith("p1"));
    expect(api.dismissReport).toHaveBeenCalledWith("r1");
  });
});
