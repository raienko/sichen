import { contentSecurityPolicy, securityHeaders } from "./index";

describe("securityHeaders", () => {
  it("sends the baseline headers in every environment", () => {
    for (const production of [true, false]) {
      expect(securityHeaders(production)).toMatchObject({
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": expect.stringContaining("microphone=()"),
      });
    }
  });

  it("reports the CSP in production and leaves it out in development", () => {
    expect(securityHeaders(true)).toHaveProperty(
      "Content-Security-Policy-Report-Only",
      contentSecurityPolicy(),
    );
    expect(Object.keys(securityHeaders(false))).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^Content-Security/)]),
    );
  });

  it("loads scripts only from the app and forbids framing and plugins", () => {
    const directives = contentSecurityPolicy().split("; ");

    expect(directives).toContain("script-src 'self'");
    expect(directives).toContain("frame-ancestors 'none'");
    expect(directives).toContain("object-src 'none'");
  });

  it("lets the page reach the map tiles", () => {
    expect(contentSecurityPolicy()).toMatch(
      /connect-src 'self'.* https:\/\/tiles\.openfreemap\.org/,
    );
  });
});
