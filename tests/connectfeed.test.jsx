import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import ConnectFeed, { ReportsQueue } from "../src/components/ConnectFeed.jsx";

afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });
beforeEach(() => localStorage.clear());

const me = { id: "me", fullName: "Dr Me", qualification: "BDS", specialty: "general" };
const post = (o = {}) => ({ id: "p1", authorId: "other", authorName: "Dr Root", authorQualification: "MDS", authorSpecialty: "endodontics", type: "case", title: "Abscess after RCT", body: "Recurrent swelling in 46 after obturation.", likeCount: 2, commentCount: 1, createdAt: Date.now() - 3600000, ...o });
const makeApi = (o = {}) => ({
  uid: "me",
  listPosts: vi.fn(async () => ({ posts: [post()], cursor: null })),
  likedSet: vi.fn(async () => new Set()), followingSet: vi.fn(async () => new Set()),
  createPost: vi.fn(async () => "n1"), deletePost: vi.fn(async () => {}), setLike: vi.fn(async () => {}), setFollow: vi.fn(async () => {}),
  listComments: vi.fn(async () => []), addComment: vi.fn(async () => {}), deleteComment: vi.fn(async () => {}),
  report: vi.fn(async () => {}), listReports: vi.fn(async () => []), getPost: vi.fn(async () => null), dismissReport: vi.fn(async () => {}),
  listPostsBy: vi.fn(async () => []), listUpcomingEvents: vi.fn(async () => []), updatePost: vi.fn(async () => {}), setAccepted: vi.fn(async () => {}),
  vote: vi.fn(async () => {}), myVotes: vi.fn(async () => ({})), savedIds: vi.fn(async () => new Set()), listSaved: vi.fn(async () => []), setSaved: vi.fn(async () => {}), countFollowers: vi.fn(async () => 0),
  getPostImages: vi.fn(async () => []),
  ...o,
});
const mount = (api, admin = false, toast = vi.fn()) => render(<ConnectFeed api={api} me={me} admin={admin} showToast={toast} />);
const article = (title) => screen.findByRole("article", { name: title });

describe("feed basics", () => {
  it("shows posts with the verified author and likes with a count", async () => {
    const api = makeApi();
    mount(api);
    const card = within(await article("Abscess after RCT"));
    expect(card.getByText("Dr Root")).toBeTruthy();
    fireEvent.click(card.getByLabelText("Helpful, 2"));
    expect(await card.findByLabelText("Helpful, 3")).toBeTruthy();
    expect(api.setLike).toHaveBeenCalledWith("p1", true);
  });

  it("lets you message another dentist from their post, but not yourself", async () => {
    const onMessage = vi.fn();
    const api = makeApi({ listPosts: vi.fn(async () => ({ posts: [post(), post({ id: "p2", authorId: "me", authorName: "Dr Me", title: "My own post" })], cursor: null })) });
    render(<ConnectFeed api={api} me={me} admin={false} showToast={vi.fn()} onMessage={onMessage} />);
    const card = within(await article("Abscess after RCT"));
    fireEvent.click(card.getByLabelText("Message Dr Root"));
    expect(onMessage).toHaveBeenCalledWith({ id: "other", name: "Dr Root" });
    expect(within(await article("My own post")).queryByLabelText(/^Message /)).toBeNull();
  });

  it("puts a like back and says so when saving fails", async () => {
    const toast = vi.fn();
    const api = makeApi({ setLike: vi.fn(async () => { throw new Error("offline"); }) });
    mount(api, false, toast);
    const card = within(await article("Abscess after RCT"));
    fireEvent.click(card.getByLabelText("Helpful, 2"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.stringMatching(/Could not save/)));
    expect(card.getByLabelText("Helpful, 2")).toBeTruthy();
  });

  it("follows an author from the post", async () => {
    const api = makeApi();
    mount(api);
    const card = within(await article("Abscess after RCT"));
    fireEvent.click(card.getByText("Follow"));
    await waitFor(() => expect(card.getByRole("button", { name: /^Following$/, pressed: true })).toBeTruthy());
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
    expect(api.createPost.mock.calls[0][0]).toMatchObject({ authorName: "Dr Me", authorId: "me", likeCount: 0, commentCount: 0 });
  });

  it("asks before posting wording that sounds like advertising", async () => {
    const api = makeApi();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    mount(api);
    fireEvent.click(await screen.findByText(/Start a discussion/));
    fireEvent.click(screen.getByRole("radio", { name: "Clinical tip" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Scaling week" } });
    fireEvent.change(screen.getByLabelText("Details"), { target: { value: "Special offer: 20% off on scaling this week." } });
    fireEvent.click(screen.getByText("Post"));
    expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/ethics rules limit advertising/));
    expect(api.createPost).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByText("Post"));
    await waitFor(() => expect(api.createPost).toHaveBeenCalledTimes(1));
  });

  it("opens a discussion and adds a comment", async () => {
    const api = makeApi();
    mount(api);
    fireEvent.click(await screen.findByText(/Discuss/));
    const box = await screen.findByLabelText("Comment on Abscess after RCT");
    fireEvent.change(box, { target: { value: "Check for a missed canal." } });
    fireEvent.click(screen.getByText("Comment"));
    await waitFor(() => expect(api.addComment).toHaveBeenCalledWith("p1", me, "Check for a missed canal."));
    expect(await screen.findByLabelText("Helpful, 2")).toBeTruthy();
    expect(screen.getByText(/Discuss · 2/)).toBeTruthy();
  });

  it("reports a post and lets authors delete their own", async () => {
    const api = makeApi({ listPosts: vi.fn(async () => ({ posts: [post(), post({ id: "p2", authorId: "me", authorName: "Dr Me", title: "My tip", type: "update" })], cursor: null })) });
    const toast = vi.fn();
    mount(api, false, toast);
    await article("My tip");
    fireEvent.click(within(await article("Abscess after RCT")).getByText("Report"));
    fireEvent.click(screen.getByText("Spam or advertising"));
    await waitFor(() => expect(api.report).toHaveBeenCalledWith({ postId: "p1", reason: "Spam or advertising" }));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(within(await article("My tip")).getByText("Delete"));
    await waitFor(() => expect(api.deletePost).toHaveBeenCalledWith("p2", 0));
    await waitFor(() => expect(screen.queryByRole("article", { name: "My tip" })).toBeNull());
  });

  it("shows an error with retry when loading fails, and an empty state", async () => {
    const listPosts = vi.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValue({ posts: [], cursor: null });
    mount(makeApi({ listPosts }));
    fireEvent.click(await screen.findByText("try again"));
    expect(await screen.findByText(/No posts yet/)).toBeTruthy();
  });

  it("loads older posts and refreshes", async () => {
    const first = Array.from({ length: 2 }, (_, i) => post({ id: `a${i}`, title: `New ${i}` }));
    const listPosts = vi.fn(async (cursor) => (cursor ? { posts: [post({ id: "old", title: "Old post" })], cursor: null } : { posts: first, cursor: "C1" }));
    mount(makeApi({ listPosts }));
    await article("New 0");
    fireEvent.click(screen.getByText("Load older posts"));
    await article("Old post");
    expect(listPosts).toHaveBeenLastCalledWith("C1");
    fireEvent.click(screen.getByLabelText("Refresh the feed"));
    await waitFor(() => expect(listPosts).toHaveBeenCalledTimes(3));
  });
});

describe("finding things", () => {
  const many = [
    post({ id: "a", title: "Abscess after RCT", likeCount: 0, commentCount: 0, createdAt: 3000, tag: "endodontics" }),
    post({ id: "b", title: "Zirconia crown prep", body: "Which bur is best?", authorName: "Dr Pros", authorId: "pros", authorSpecialty: "prosthodontics", type: "question", tag: "prosthodontics", likeCount: 1, commentCount: 6, createdAt: 2000 }),
  ];
  const withMany = (o = {}) => makeApi({ listPosts: vi.fn(async () => ({ posts: many, cursor: null })), ...o });
  const titles = () => screen.getAllByRole("article").map((a) => a.getAttribute("aria-label"));

  it("searches posts and says when nothing matches", async () => {
    mount(withMany());
    await article("Zirconia crown prep");
    fireEvent.change(screen.getByLabelText("Search posts"), { target: { value: "zirconia bur" } });
    expect(titles()).toEqual(["Zirconia crown prep"]);
    fireEvent.change(screen.getByLabelText("Search posts"), { target: { value: "orthodontic" } });
    expect(await screen.findByText(/No posts match "orthodontic"/)).toBeTruthy();
  });

  it("orders by most discussed on request", async () => {
    mount(withMany());
    await article("Zirconia crown prep");
    expect(titles()).toEqual(["Abscess after RCT", "Zirconia crown prep"]);
    fireEvent.change(screen.getByLabelText("Sort posts"), { target: { value: "top" } });
    expect(titles()).toEqual(["Zirconia crown prep", "Abscess after RCT"]);
  });

  it("filters by trending topic and by post type", async () => {
    mount(withMany());
    await article("Zirconia crown prep");
    const topics = within(screen.getByRole("region", { name: "Trending topics" }));
    fireEvent.click(topics.getByRole("button", { name: /Endodontics/ }));
    expect(titles()).toEqual(["Abscess after RCT"]);
    fireEvent.click(topics.getByRole("button", { name: /Endodontics/ }));
    fireEvent.click(within(screen.getByRole("group", { name: "Filter posts" })).getByRole("button", { name: "Questions" }));
    expect(titles()).toEqual(["Zirconia crown prep"]);
  });

  it("opens a colleague's posts from their name, then goes back", async () => {
    const listPostsBy = vi.fn(async (id) => (id === "pros" ? [many[1], post({ id: "z", title: "Older zirconia tip", authorId: "pros", authorName: "Dr Pros", createdAt: 10 })] : []));
    mount(withMany({ listPostsBy }));
    fireEvent.click(within(await article("Zirconia crown prep")).getByRole("button", { name: "Dr Pros" }));
    await article("Older zirconia tip");
    expect(listPostsBy).toHaveBeenCalledWith("pros");
    expect(screen.getByRole("region", { name: "Posts by Dr Pros" })).toBeTruthy();
    expect(screen.queryByRole("article", { name: "Abscess after RCT" })).toBeNull();
    fireEvent.click(screen.getByText("Back to the feed"));
    expect(await article("Abscess after RCT")).toBeTruthy();
  });
});

describe("my profile, saved posts and my posts", () => {
  it("shows my numbers", async () => {
    const api = makeApi({
      listPostsBy: vi.fn(async () => [post({ id: "m1", authorId: "me", title: "Mine one" }), post({ id: "m2", authorId: "me", title: "Mine two" })]),
      countFollowers: vi.fn(async () => 7), followingSet: vi.fn(async () => new Set(["a", "b", "c"])),
    });
    mount(api);
    const profile = within(await screen.findByRole("complementary", { name: "Your profile" }));
    await waitFor(() => expect(profile.getByText("7")).toBeTruthy());
    expect(profile.getByText("2")).toBeTruthy();
    expect(profile.getByText("3")).toBeTruthy();
  });

  it("lists all my posts even when they are not on the first page of the feed", async () => {
    const api = makeApi({ listPostsBy: vi.fn(async () => [post({ id: "m1", authorId: "me", authorName: "Dr Me", title: "Mine from last month" })]) });
    mount(api);
    await article("Abscess after RCT");
    expect(screen.queryByRole("article", { name: "Mine from last month" })).toBeNull();
    fireEvent.click(within(screen.getByRole("group", { name: "Filter posts" })).getByRole("button", { name: "My posts" }));
    expect(await article("Mine from last month")).toBeTruthy();
    expect(screen.queryByRole("article", { name: "Abscess after RCT" })).toBeNull();
  });

  it("saves a post, lists it under Saved, and removes it", async () => {
    const saved = new Set();
    const api = makeApi({
      setSaved: vi.fn(async (id, on) => { on ? saved.add(id) : saved.delete(id); }),
      listSaved: vi.fn(async () => (saved.has("p1") ? [post()] : [])),
    });
    mount(api);
    fireEvent.click(within(await article("Abscess after RCT")).getByRole("button", { name: "Save this post" }));
    await waitFor(() => expect(api.setSaved).toHaveBeenCalledWith("p1", true));
    fireEvent.click(within(screen.getByRole("group", { name: "Filter posts" })).getByRole("button", { name: "Saved" }));
    const card = within(await article("Abscess after RCT"));
    fireEvent.click(card.getByRole("button", { name: /Remove from saved posts/ }));
    await waitFor(() => expect(api.setSaved).toHaveBeenLastCalledWith("p1", false));
    expect(await screen.findByText(/Nothing saved yet/)).toBeTruthy();
  });
});

describe("editing and answers", () => {
  it("edits my own post after re-confirming, and marks it edited", async () => {
    const mine = post({ id: "m1", authorId: "me", authorName: "Dr Me", title: "Old title", tag: "endodontics" });
    const api = makeApi({ listPosts: vi.fn(async () => ({ posts: [mine], cursor: null })) });
    mount(api);
    fireEvent.click(within(await article("Old title")).getByText("Edit"));
    const form = within(screen.getByRole("form", { name: "Edit post" }));
    fireEvent.change(form.getByLabelText("Title"), { target: { value: "Better title" } });
    fireEvent.change(form.getByLabelText(/Topic/), { target: { value: "" } });
    fireEvent.click(form.getByText("Save changes"));
    expect((await form.findByRole("alert")).textContent).toMatch(/cannot be identified/);
    fireEvent.click(form.getByRole("checkbox"));
    fireEvent.click(form.getByText("Save changes"));
    await waitFor(() => expect(api.updatePost).toHaveBeenCalledWith("m1", { set: { title: "Better title", body: mine.body }, unset: ["tag"] }));
    const card = within(await article("Better title"));
    expect(card.getByText(/edited/)).toBeTruthy();
  });

  it("only the asker can mark an answer, and it shows as answered", async () => {
    const q = post({ id: "q1", authorId: "me", authorName: "Dr Me", type: "question", title: "Which bur?", commentCount: 2 });
    const comments = [
      { id: "c1", authorId: "x", authorName: "Dr X", authorSpecialty: "general", text: "Use a fine diamond.", createdAt: 1 },
      { id: "c2", authorId: "y", authorName: "Dr Y", authorSpecialty: "general", text: "Carbide works too.", createdAt: 2 },
    ];
    const api = makeApi({ listPosts: vi.fn(async () => ({ posts: [q], cursor: null })), listComments: vi.fn(async () => comments) });
    mount(api);
    const card = within(await article("Which bur?"));
    fireEvent.click(card.getByText(/Discuss/));
    fireEvent.click((await card.findAllByText("Mark as answer"))[1]);
    await waitFor(() => expect(api.setAccepted).toHaveBeenCalledWith("q1", "c2"));
    expect(await card.findByText("Accepted answer")).toBeTruthy();
    expect(card.getByText("Answered")).toBeTruthy();
    const order = card.getAllByRole("listitem").map((li) => li.textContent);
    expect(order[0]).toMatch(/Dr Y/);
  });

  it("does not offer to mark an answer on someone else's question", async () => {
    const api = makeApi({
      listPosts: vi.fn(async () => ({ posts: [post({ type: "question", title: "Not mine" })], cursor: null })),
      listComments: vi.fn(async () => [{ id: "c1", authorId: "x", authorName: "Dr X", authorSpecialty: "general", text: "Reply", createdAt: 1 }]),
    });
    mount(api);
    const card = within(await article("Not mine"));
    fireEvent.click(card.getByText(/Discuss/));
    await card.findByText("Reply");
    expect(card.queryByText("Mark as answer")).toBeNull();
  });
});

describe("activity, events and invites", () => {
  it("flags new comments and Helpful marks on my posts, until dismissed", async () => {
    localStorage.setItem("merident_connect_seen_me", JSON.stringify({ m1: [0, 0] }));
    const api = makeApi({ listPostsBy: vi.fn(async () => [post({ id: "m1", authorId: "me", title: "Mine", likeCount: 3, commentCount: 2 })]) });
    const { unmount } = mount(api);
    expect(await screen.findByText(/Your posts have 2 new comments and 3 new Helpful marks/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Dismiss"));
    await waitFor(() => expect(screen.queryByText(/Your posts have/)).toBeNull());
    unmount();
    mount(makeApi({ listPostsBy: vi.fn(async () => [post({ id: "m1", authorId: "me", title: "Mine", likeCount: 3, commentCount: 2 })]) }));
    await article("Abscess after RCT");
    expect(screen.queryByText(/Your posts have/)).toBeNull();
  });

  it("does not flag old activity the first time", async () => {
    mount(makeApi({ listPostsBy: vi.fn(async () => [post({ id: "m1", authorId: "me", likeCount: 9, commentCount: 9 })]) }));
    await article("Abscess after RCT");
    const profile = within(screen.getByRole("complementary", { name: "Your profile" }));
    await waitFor(() => expect(profile.getByText("1")).toBeTruthy());
    expect(screen.queryByText(/Your posts have/)).toBeNull();
    expect(JSON.parse(localStorage.getItem("merident_connect_seen_me"))).toEqual({ m1: [9, 9] });
  });

  it("lists upcoming events and downloads a calendar file", async () => {
    const created = [];
    URL.createObjectURL = vi.fn((blob) => { created.push(blob); return "blob:x"; });
    URL.revokeObjectURL = vi.fn();
    const ev = post({ id: "e1", type: "event", title: "CBCT workshop", eventDate: "2099-03-05", venue: "Coimbatore", authorName: "Dr Ev", authorId: "ev" });
    mount(makeApi({ listUpcomingEvents: vi.fn(async () => [ev]), listPosts: vi.fn(async () => ({ posts: [], cursor: null })) }));
    const side = within(await screen.findByRole("region", { name: "Upcoming events" }));
    expect(await side.findByText("CBCT workshop")).toBeTruthy();
    expect(side.getByText("Mar")).toBeTruthy();
    fireEvent.click(side.getByLabelText("Add CBCT workshop to calendar"));
    expect(created).toHaveLength(1);
    expect(await created[0].text()).toMatch(/DTSTART;VALUE=DATE:20990305/);
  });

  it("offers a WhatsApp invite and suggests colleagues to follow", async () => {
    mount(makeApi());
    await article("Abscess after RCT");
    const invite = within(screen.getByRole("region", { name: "Invite a colleague" })).getByRole("link");
    expect(invite.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\?text=/);
    const people = within(screen.getByRole("region", { name: "Colleagues to follow" }));
    fireEvent.click(people.getByLabelText("Follow Dr Root"));
    await waitFor(() => expect(screen.queryByRole("region", { name: "Colleagues to follow" })).toBeNull());
  });

  it("shows the guidelines", async () => {
    mount(makeApi());
    expect(await screen.findByText(/Community guidelines/)).toBeTruthy();
    expect(screen.getByText(/Do not advertise your clinic/)).toBeTruthy();
  });

  it("keeps working when the extra lookups are unavailable", async () => {
    const api = makeApi({ listPostsBy: vi.fn(async () => { throw new Error("x"); }), listUpcomingEvents: vi.fn(async () => { throw new Error("x"); }), savedIds: vi.fn(async () => { throw new Error("x"); }), countFollowers: vi.fn(async () => { throw new Error("x"); }) });
    mount(api);
    expect(await article("Abscess after RCT")).toBeTruthy();
  });
});

describe("staff reports queue", () => {
  it("removes a reported post", async () => {
    const api = makeApi({ listReports: vi.fn(async () => [{ id: "r1", postId: "p1", reason: "Spam or advertising" }]), getPost: vi.fn(async () => post()) });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ReportsQueue api={api} showToast={vi.fn()} />);
    fireEvent.click(await screen.findByText("Remove post"));
    await waitFor(() => expect(api.deletePost).toHaveBeenCalledWith("p1"));
    expect(api.dismissReport).toHaveBeenCalledWith("r1");
  });
});

describe("polls", () => {
  const poll = (o = {}) => post({ id: "pl1", type: "poll", title: "Which file system?", body: "", pollOptions: ["Rotary", "Reciprocating", "Hand"], v0: 2, v1: 1, v2: 0, likeCount: 0, commentCount: 0, ...o });
  const withPoll = (o = {}, api = {}) => makeApi({ listPosts: vi.fn(async () => ({ posts: [poll(o)], cursor: null })), ...api });

  it("hides results until you vote, then shows them and keeps your choice", async () => {
    const api = withPoll();
    mount(api);
    const card = within(await article("Which file system?"));
    expect(card.getByText(/Vote to see the results/)).toBeTruthy();
    expect(card.queryByText(/67%/)).toBeNull();
    fireEvent.click(card.getByRole("button", { name: "Hand" }));
    await waitFor(() => expect(api.vote).toHaveBeenCalledWith("pl1", 2));
    expect(await card.findByText(/Hand \(your vote\)/)).toBeTruthy();
    expect(card.getByText(/50%/)).toBeTruthy();
    expect(card.getByText(/4 votes/)).toBeTruthy();
    expect(card.queryByRole("button", { name: "Rotary" })).toBeNull();
  });

  it("shows results at once if you already voted, and to the author", async () => {
    mount(withPoll({}, { myVotes: vi.fn(async () => ({ pl1: 1 })) }));
    const card = within(await article("Which file system?"));
    expect(await card.findByText(/Reciprocating \(your vote\)/)).toBeTruthy();
    cleanup();
    mount(withPoll({ authorId: "me", authorName: "Dr Me" }));
    expect(await within(await article("Which file system?")).findByText(/67%/)).toBeTruthy();
  });

  it("takes the vote back and says so when saving fails", async () => {
    const toast = vi.fn();
    mount(withPoll({}, { vote: vi.fn(async () => { throw new Error("denied"); }) }), false, toast);
    const card = within(await article("Which file system?"));
    fireEvent.click(card.getByRole("button", { name: "Rotary" }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.stringMatching(/Could not save your vote/)));
    expect(await card.findByRole("button", { name: "Rotary" })).toBeTruthy();
  });

  it("creates a poll with options and no patient confirmation", async () => {
    const api = makeApi();
    mount(api);
    fireEvent.click(await screen.findByText(/Start a discussion/));
    fireEvent.click(screen.getByRole("radio", { name: "Poll" }));
    expect(screen.queryByRole("checkbox")).toBeNull();
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Best bur for zirconia?" } });
    fireEvent.change(screen.getByLabelText("Option 1"), { target: { value: "Diamond" } });
    fireEvent.click(screen.getByText("Post"));
    expect((await screen.findByRole("alert")).textContent).toMatch(/at least 2 options/);
    fireEvent.change(screen.getByLabelText("Option 2"), { target: { value: "Carbide" } });
    fireEvent.click(screen.getByText("Add an option"));
    fireEvent.change(screen.getByLabelText("Option 3"), { target: { value: "Ceramic" } });
    fireEvent.click(screen.getByText("Post"));
    await waitFor(() => expect(api.createPost).toHaveBeenCalledTimes(1));
    expect(api.createPost.mock.calls[0][0]).toMatchObject({ type: "poll", pollOptions: ["Diamond", "Carbide", "Ceramic"], v0: 0, v1: 0, v2: 0 });
  });
});

describe("case images", () => {
  const JPG = "data:image/jpeg;base64," + "A".repeat(100);
  const stubCanvas = () => {
    globalThis.createImageBitmap = vi.fn(async () => ({ width: 2000, height: 1000 }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillRect() {}, drawImage() {}, set fillStyle(v) {} });
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(JPG);
  };

  it("attaches up to two photos to a case and sends them with the post", async () => {
    stubCanvas();
    const api = makeApi();
    mount(api);
    fireEvent.click(await screen.findByText(/Start a discussion/));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Swelling in 36" } });
    fireEvent.change(screen.getByLabelText("Details"), { target: { value: "Female, 34, swelling in 36 for two days, no fever." } });
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText("Add an image"), { target: { files: [file, file, file] } });
    await waitFor(() => expect(screen.getAllByAltText(/Attached image/)).toHaveLength(2));
    expect(screen.queryByLabelText("Add an image")).toBeNull();
    fireEvent.click(screen.getByLabelText("Remove image 1"));
    expect(screen.getAllByAltText(/Attached image/)).toHaveLength(1);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText("Post"));
    await waitFor(() => expect(api.createPost).toHaveBeenCalledTimes(1));
    expect(api.createPost.mock.calls[0][0]).toMatchObject({ type: "case", imageCount: 1 });
    expect(api.createPost.mock.calls[0][1]).toEqual([JPG]);
  });

  it("does not offer images on other post types", async () => {
    mount(makeApi());
    fireEvent.click(await screen.findByText(/Start a discussion/));
    fireEvent.click(screen.getByRole("radio", { name: "Ask peers" }));
    expect(screen.queryByLabelText("Add an image")).toBeNull();
  });

  it("shows a case's images on the card and opens one full size", async () => {
    const api = makeApi({ listPosts: vi.fn(async () => ({ posts: [post({ imageCount: 2 })], cursor: null })), getPostImages: vi.fn(async () => [JPG, JPG]) });
    mount(api);
    const card = within(await article("Abscess after RCT"));
    expect(await card.findAllByAltText(/Case image/)).toHaveLength(2);
    expect(api.getPostImages).toHaveBeenCalledWith("p1", 2);
    fireEvent.click(card.getByLabelText("View image 1 of 2 full size"));
    expect(screen.getByRole("dialog", { name: "Case image" })).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Close image"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("passes the image count when deleting so the pictures go first", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const api = makeApi({ uid: "other", listPosts: vi.fn(async () => ({ posts: [post({ imageCount: 1 })], cursor: null })), getPostImages: vi.fn(async () => [JPG]) });
    mount(api);
    const card = within(await article("Abscess after RCT"));
    fireEvent.click(card.getByRole("button", { name: /Delete/ }));
    await waitFor(() => expect(api.deletePost).toHaveBeenCalledWith("p1", 1));
  });
});
