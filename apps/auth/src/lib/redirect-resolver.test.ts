import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isSafeCallbackUrl, resolveAuthRedirect } from "./redirect-resolver";

describe("isSafeCallbackUrl", () => {
  it("accepts local relative paths", () => {
    assert.equal(isSafeCallbackUrl("/dashboard"), true);
    assert.equal(isSafeCallbackUrl("/galas/123/enter"), true);
  });

  it("rejects protocol-relative and malicious open redirects", () => {
    assert.equal(isSafeCallbackUrl("//evil.com"), false);
    assert.equal(isSafeCallbackUrl("javascript:alert(1)"), false);
    assert.equal(isSafeCallbackUrl("https://phishing.com/aquateamhub"), false);
  });

  it("accepts official AquaTeamHub subdomains and localhost ports", () => {
    assert.equal(isSafeCallbackUrl("https://myclub.aquateamhub.com/roster"), true);
    assert.equal(isSafeCallbackUrl("https://my.aquateamhub.com/swimmers"), true);
    assert.equal(isSafeCallbackUrl("http://localhost:3000/"), true);
    assert.equal(isSafeCallbackUrl("http://localhost:3002/my-swimmers"), true);
  });
});

describe("resolveAuthRedirect", () => {
  const envUrls = {
    myclubUrl: "https://myclub.aquateamhub.com",
    myUrl: "https://my.aquateamhub.com",
    resultsUrl: "https://results.aquateamhub.com",
    wwwUrl: "https://www.aquateamhub.com",
  };

  it("routes verified staff (Coaches, Admins, Officials) to myclub", () => {
    const res = resolveAuthRedirect({
      user: { id: "u1", email: "coach@swimming.org" },
      memberships: [{ role: "COACH", clubId: "c1" }],
      envUrls,
    });

    assert.equal(res.portal, "MYCLUB");
    assert.equal(res.targetUrl, "https://myclub.aquateamhub.com");
    assert.ok(res.reason.includes("Verified club staff"));
  });

  it("routes parents with linked swimmers to my PWA", () => {
    const res = resolveAuthRedirect({
      user: { id: "u2", email: "parent@family.com" },
      memberships: [{ role: "PARENT", clubId: "c1" }],
      guardianLinksCount: 2,
      envUrls,
    });

    assert.equal(res.portal, "MY");
    assert.equal(res.targetUrl, "https://my.aquateamhub.com");
  });

  it("respects safe explicit callback URLs", () => {
    const res = resolveAuthRedirect({
      user: { id: "u3", email: "user@aquatics.org" },
      memberships: [{ role: "COACH", clubId: "c1" }],
      callbackUrl: "https://results.aquateamhub.com/live",
      envUrls,
    });

    assert.equal(res.targetUrl, "https://results.aquateamhub.com/live");
    assert.equal(res.portal, "RESULTS");
  });

  it("defaults new unlinked accounts to my PWA for swimmer onboarding", () => {
    const res = resolveAuthRedirect({
      user: { id: "u4", email: "newuser@example.com" },
      memberships: [],
      guardianLinksCount: 0,
      envUrls,
    });

    assert.equal(res.portal, "MY");
    assert.equal(res.targetUrl, "https://my.aquateamhub.com");
  });
});
