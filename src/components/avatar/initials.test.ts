import { getInitials } from "./initials";

describe("getInitials", () => {
  it("takes the first letter of the first and last words", () => {
    expect(getInitials("Ada Lovelace", "en")).toBe("AL");
  });

  it("gives a single word a single character", () => {
    expect(getInitials("Ada", "en")).toBe("A");
  });

  // A monogram that grows with the length of someone's name stops fitting.
  it("skips middle names rather than growing", () => {
    expect(getInitials("Ada Augusta Byron Lovelace", "en")).toBe("AL");
  });

  it("uppercases a lowercase name", () => {
    expect(getInitials("ada lovelace", "en")).toBe("AL");
  });

  it("survives extra whitespace", () => {
    expect(getInitials("   Ada    Lovelace  ", "en")).toBe("AL");
  });

  it("has nothing to say about an empty name", () => {
    expect(getInitials("", "en")).toBe("");
    expect(getInitials("   ", "en")).toBe("");
  });

  // One "word" to `split`, so it gets one character — the same rule a
  // mononym gets.
  it("takes one character from a CJK name written without spaces", () => {
    expect(getInitials("山田太郎", "ja")).toBe("山");
  });

  // "🙂"[0] is half a surrogate pair and renders as a replacement
  // character; iterating code points keeps it whole.
  it("keeps an astral-plane character whole", () => {
    expect(getInitials("🙂 Smith", "en")).toBe("🙂S");
  });

  it("reads through punctuation inside a word", () => {
    expect(getInitials("Jean-Luc Picard", "en")).toBe("JP");
    expect(getInitials("O'Brien", "en")).toBe("O");
  });

  // The uppercase mapping isn't universal, which is why this takes a locale
  // at all rather than calling toUpperCase().
  it("uppercases through the locale", () => {
    expect(getInitials("ilhan", "tr")).toBe("İ");
    expect(getInitials("ilhan", "en")).toBe("I");
  });
});
