// @vitest-environment jsdom
import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { allowedOrigins, handshakePage } from "@/lib/cms-oauth";

const SUCCESS = 'authorization:github:success:{"token":"secret","provider":"github"}';

/** Renders the popup page with a fake opener and returns what it posted. */
function runPopup(origins: string[]) {
  const posted: Array<{ message: unknown; target: string }> = [];
  const opener = {
    postMessage: vi.fn((message: unknown, target: string) => posted.push({ message, target })),
  };
  const dom = new JSDOM(handshakePage(SUCCESS, origins), {
    runScripts: "dangerously",
    beforeParse(window) {
      Object.defineProperty(window, "opener", { value: opener });
    },
  });
  const reply = (origin: string, source: unknown) => {
    const event = new dom.window.MessageEvent("message", { data: "authorizing:github", origin });
    Object.defineProperty(event, "source", { value: source });
    dom.window.dispatchEvent(event);
  };
  return { posted, reply, opener, dom };
}

describe("CMS OAuth popup", () => {
  it("allows this deployment and the public site, plus configured extras", () => {
    vi.stubEnv("CMS_ALLOWED_ORIGINS", "https://preview.example.com");
    expect(allowedOrigins("https://psychmind-website.vercel.app")).toEqual([
      "https://psychmind-website.vercel.app",
      "https://psychmind.org",
      "https://www.psychmind.org",
      "https://preview.example.com",
    ]);
    vi.unstubAllEnvs();
  });

  it("announces itself without leaking the token", () => {
    const { posted } = runPopup(["https://www.psychmind.org"]);
    expect(posted).toEqual([{ message: "authorizing:github", target: "*" }]);
  });

  it("never sends the token to a foreign origin", () => {
    const { posted, reply, opener } = runPopup(["https://www.psychmind.org"]);
    reply("https://evil.example", opener);
    expect(posted.some((p) => String(p.message).includes("secret"))).toBe(false);
  });

  it("ignores replies that don't come from the opener window", () => {
    const { posted, reply } = runPopup(["https://www.psychmind.org"]);
    reply("https://www.psychmind.org", {});
    expect(posted.some((p) => String(p.message).includes("secret"))).toBe(false);
  });

  it("sends the token to the opener on an allowed origin, once", () => {
    const { posted, reply, opener } = runPopup(["https://www.psychmind.org"]);
    reply("https://www.psychmind.org", opener);
    reply("https://www.psychmind.org", opener);
    const tokenPosts = posted.filter((p) => String(p.message).includes("secret"));
    expect(tokenPosts).toEqual([{ message: SUCCESS, target: "https://www.psychmind.org" }]);
  });

  it("escapes markup so the message can't break out of the script tag", () => {
    expect(handshakePage("</script><script>alert(1)</script>", [])).not.toContain("</script><script>");
  });
});
