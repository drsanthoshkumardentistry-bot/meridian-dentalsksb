import React from "react";
import fs from "node:fs";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import BlogPage from "../src/components/BlogPage.jsx";
import { BLOG_POSTS, BLOG_PATH, blogPostForPath, isBlogIndex } from "../src/blogPosts.js";
import { SEO_PAGES, sitemapXml } from "../src/seoPages.js";

afterEach(() => cleanup());

describe("blog", () => {
  it("finds posts by path and recognises the index", () => {
    expect(blogPostForPath("/blog/reduce-dental-no-shows/").h1).toMatch(/no-shows/);
    expect(blogPostForPath("/blog/nope")).toBeNull();
    expect(isBlogIndex("/blog")).toBe(true);
    expect(isBlogIndex("/blog/")).toBe(true);
    expect(isBlogIndex("/dental")).toBe(false);
  });

  it("gives every post a unique path, title and description of sensible length", () => {
    expect(new Set(BLOG_POSTS.map((b) => b.path)).size).toBe(BLOG_POSTS.length);
    expect(new Set(BLOG_POSTS.map((b) => b.title)).size).toBe(BLOG_POSTS.length);
    BLOG_POSTS.forEach((b) => {
      expect(b.path).toBe(`${BLOG_PATH}/${b.slug}`);
      expect(b.slug).toMatch(/^[a-z-]+$/);
      expect(b.description.length).toBeGreaterThan(60);
      expect(b.description.length).toBeLessThan(200);
      expect(b.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      (b.related || []).forEach((r) => expect(SEO_PAGES.some((p) => p.path === r)).toBe(true));
    });
  });

  it("stays honest: no unverifiable claims, says we build MeriDent", () => {
    BLOG_POSTS.forEach((b) => {
      const text = JSON.stringify(b);
      expect(text).not.toMatch(/trusted by|\d+\+ clinics|testimonial|DPDP compliant|HIPAA|best dental|#1|automatically sends|guarantee/i);
      expect(text).toMatch(/We build MeriDent/);
    });
    expect(JSON.stringify(blogPostForPath("/blog/reduce-dental-no-shows"))).toMatch(/does not send WhatsApp messages by itself/);
  });

  it("renders the index with a link to every post", () => {
    render(<BlogPage post={null} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/dental clinic owners/);
    BLOG_POSTS.forEach((b) => expect(screen.getByText(b.h1).closest("a").getAttribute("href")).toBe(b.path));
    expect(screen.getByText(/formerly Meridian Dental OS/)).toBeTruthy();
  });

  it("renders a post with article data, a start link and related pages", () => {
    const post = BLOG_POSTS[0];
    render(<BlogPage post={post} />);
    expect(document.title).toBe(post.title);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(post.h1);
    const ld = JSON.parse(document.head.querySelector('script[type="application/ld+json"]').textContent);
    expect(ld["@type"]).toBe("BlogPosting");
    expect(ld.datePublished).toBe(post.date);
    expect(screen.getAllByText(/Start free/)[0].closest("a").getAttribute("href")).toBe("/login");
    expect(screen.getByText("For dental clinics")).toBeTruthy();
  });

  it("lists blog pages in the sitemap and keeps it in step", () => {
    const xml = sitemapXml();
    expect(xml).toContain("https://www.meridiandentalos.com/blog</loc>");
    BLOG_POSTS.forEach((b) => expect(xml).toContain(`${b.path}</loc>`));
    expect(fs.readFileSync("public/sitemap.xml", "utf8")).toBe(xml);
  });
});
