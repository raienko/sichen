import { linkify } from "./linkify";

const links = (text: string) =>
  linkify(text).flatMap((segment) =>
    segment.type === "link" ? [[segment.kind, segment.text, segment.url]] : [],
  );

describe("linkify", () => {
  it("leaves text without links as one segment", () => {
    expect(linkify("See you at 3")).toEqual([
      { type: "text", text: "See you at 3" },
    ]);
  });

  it("finds web addresses, adding a scheme where none was typed", () => {
    expect(
      links("Notes at https://example.com/a?b=1 and www.example.org"),
    ).toEqual([
      ["url", "https://example.com/a?b=1", "https://example.com/a?b=1"],
      ["url", "www.example.org", "https://www.example.org"],
    ]);
  });

  it("keeps the sentence's punctuation out of the link", () => {
    expect(links("Look: https://example.com.")).toEqual([
      ["url", "https://example.com", "https://example.com"],
    ]);
    expect(links("(see https://example.com/x)")).toEqual([
      ["url", "https://example.com/x", "https://example.com/x"],
    ]);
  });

  it("keeps brackets that belong to the address", () => {
    expect(links("https://en.wikipedia.org/wiki/Alien_(film)")).toEqual([
      [
        "url",
        "https://en.wikipedia.org/wiki/Alien_(film)",
        "https://en.wikipedia.org/wiki/Alien_(film)",
      ],
    ]);
  });

  it("finds email addresses and international phone numbers", () => {
    expect(links("Mail ada@example.com or call +44 20 7946 0958")).toEqual([
      ["email", "ada@example.com", "mailto:ada@example.com"],
      ["phone", "+44 20 7946 0958", "tel:+442079460958"],
    ]);
  });

  it("doesn't guess at numbers without a country code", () => {
    expect(links("Order 0441 234 567 ships on 12.03")).toEqual([]);
  });

  it("doesn't link an email inside a URL twice", () => {
    expect(links("https://example.com/?to=ada@example.com")).toEqual([
      [
        "url",
        "https://example.com/?to=ada@example.com",
        "https://example.com/?to=ada@example.com",
      ],
    ]);
  });

  it("reassembles to the original text", () => {
    const text = "a https://x.io b ada@x.io c +1 202 555 0143 d";
    expect(
      linkify(text)
        .map((segment) => segment.text)
        .join(""),
    ).toBe(text);
  });
});
