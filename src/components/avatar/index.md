[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Display & identity

# Avatar

> A person or thing as a picture, initials or icon, with an optional status dot.

<sub>`src/components/avatar` · [Stories](index.stories.tsx) · Tests: [`index.test.tsx`](index.test.tsx), [`group.test.tsx`](group.test.tsx), [`initials.test.ts`](initials.test.ts), [`style.test.tsx`](style.test.tsx)</sub>

```tsx
import Avatar from "@/components/avatar";

<Avatar name="Ada Lovelace" source={user.avatarUrl} />
<Avatar name="Ada Lovelace" status="success" statusLabel="Online" />
<Avatar name="Design team" icon={<Icon name="users" />} size="large" />

<Avatar.Group people={members} max={4} />   // also: import { AvatarGroup } from "@/components/avatar"
```

The picture of a person or a thing, in a square: a list row's leading slot, a comment's author, the account button in a header.

- **The fallbacks are a stack, not a branch.** The monogram (or `icon`) is always rendered and the picture sits on top of it, so an avatar with no source shows initials, one whose source fails shows initials, and one that is _still loading_ shows initials until the picture arrives. There is no separate loading state to design, because the thing underneath is already the right thing to look at. `Image` owns the error detection and the log; this just declines its generic placeholder (`fallback={null}`) in favour of something that says who this is.
- **It reuses `Image`, so it reuses that cache** — no second one. An avatar URL warmed through `Image.preload()` is already warm here.
- **`name` does double duty on purpose**: it is the accessible name _and_ what the monogram is derived from, so the two can't disagree. `getInitials` (`initials.ts`, pure and separately tested) takes the first character of the first and last words and skips the middle ones — a monogram that grew with the length of someone's name would stop fitting the circle. It iterates code points rather than UTF-16 units, so `"🙂 Smith"` gives `🙂S` instead of half a surrogate pair, and it uppercases through the active locale, because that mapping isn't universal (Turkish `i` → `İ`).
- **The whole avatar is one accessibility element**, named from `name` with the status appended. The picture is `decorative` and the monogram is spread with `disabledA11yProps()`: a screen reader announcing "A L" would be reading the abbreviation instead of the person, and the monogram's larger sizes are title steps, which carry heading semantics in `Text` and have no business in a heading rotor. An avatar left with nothing to be called — no name and no status — is hidden outright rather than left as an element with an empty name, the treatment an unlabelled `Badge` dot gets. The label is joined from the parts that exist, so a nameless avatar with a status announces "Online" and not ", Online".
- **A `status` requires a `statusLabel`, in the types.** A dot is colour, and colour alone is not information (WCAG 1.4.1) — the same reason every `Toast` type carries an `announcement`. The dot is a `Badge`, sat over the square's corner with a ring in the page colour that cuts it out of the picture underneath. It's a sibling of the clipping surface rather than a child, or `overflow: "hidden"` would cut it in half, and it scales with the avatar — fixed at `Badge`'s own 8pt it vanishes on a large one.
- **The monogram doesn't scale with the OS text size** (`allowFontScaling={false}`). The square is a fixed graphic that has to line up down a list, so letters that grew would clip rather than help — and the name is available in full to anyone reading by screen reader. Everything else scales with the device through `units()` as usual.
- **The square sides (32/48/64) are local to this component** rather than entries in the sizes styleguide: nothing else in the app is measured in avatars, and the styleguide's own note says a bespoke measurement stays local. The status dot's side is chosen from `isRTL` rather than RN's `end`, which resolves through `I18nManager` and so lags a locale switch by a native reload — verified live by switching to العربية and watching the dot move from x=60 to x=10 on a 70px avatar.
- **There is no per-person colour tint.** Deterministic here means the _monogram_ is deterministic; tinting each avatar by a hash of the name would need a set of avatar colours in the palette and a contrast check for each of them against both schemes, which is a palette change rather than a component one. Every avatar uses `backgroundElement` over a `border` edge, the same surface `ImageFallback` and `Button`'s `secondary` use, and for the same reason.
- **`Avatar.Group` overlaps several** (`group.tsx`): a chat's members, a document's collaborators. The "+N" tile takes the last slot, so the row is never wider than `max` squares. Each square sits in a ring of the page colour, the same cut-out the status dot uses, and the row flips in RTL. The whole group is one accessibility element — "Ada, Grace and 3 more" — and the squares inside are hidden. The square sides it lines up with are shared from `avatar.tsx` as `AVATAR_SIDE`.
- **It isn't pressable.** An avatar that navigates is a button with an avatar in it; wrap it rather than growing a second press channel here.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
