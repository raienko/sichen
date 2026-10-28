[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Forms & input

# Input

> One field component, switched by `type`: text, textarea, numeric, email, password, code, phone, select, date/time, file, groups and ranges.

<sub>`src/components/input` · [Stories](index.stories.tsx) · [Tests](index.test.tsx)</sub>

```tsx
import Input from "@/components/input";

<Input
  label="Name"
  placeholder="Ada Lovelace"
  value={name}
  onChange={setName}
/>;
<Input
  type="numeric"
  label="Age"
  value={age}
  onChange={setAge}
  min={0}
  max={120}
/>;
<Input type="email" label="Email" value={email} onChange={setEmail} />;
<Input value={query} onChange={setQuery} leftSlot={<Icon name="search" />} />;
```

One component, branching on `type` — like `<input>` in HTML. `type` is optional and defaults to `"text"`.

```
src/components/input/
  index.tsx     Input — picks a variation by `type` and renders it
  types.ts       CommonInputProps + each type's own props (the public API)
  base/           BaseInput — the shared shell: label, slots, focus/disabled styling
  text/           TextInput — type="text" (default)
  textarea/       TextAreaInput — type="textarea", multiline with an optional character limit
  numeric/        NumericInput — type="numeric", + its own use-numeric-text.ts
  email/          EmailInput — type="email", email keyboard + autofill hint
  password/       PasswordInput — type="password", visibility + autofill semantics
  code/           CodeInput — type="code", one-time-code entry
  phone/          PhoneInput — type="phone", country selection + E.164 output
  select/         SelectInput — type="select", modal option selection
  file/           FileInput — type="file", system file browser via FilePicker
  datetime/       DateTimeInput — type="datetime", date/time/datetime modes
  color/          ColorInput — type="color", ColorPicker + hex field in a sheet
```

- **Every variation is its own component in its own folder**, not a branch inline in one big file. `BaseInput` (`./base`) owns everything shared — label, `leftSlot`/`rightSlot`, focus/disabled styling, and the actual value host. Each variation resolves its own value shape and type-specific behavior, then renders through that shared shell; `Input` (`index.tsx`) only dispatches by `type`. Adding another variation means one folder, its tests/stories, its props union member, and one dispatcher case.
- **Shared API**: every variation takes `value`/`onChange` plus the applicable common field props. A variation adds only what it specifically needs: numeric bounds, password autofill intent, code length/charset, phone country, select options, or date/time bounds. The discriminated union means a prop or value shape that does not belong to the selected `type` is a `tsc` error.
- **`autoCapitalize`/`autoCorrect` default off for every variation**, enforced in one place: `BaseInput` defaults them (`"none"`/`false`) when not passed, so every current and future variation gets that default for free instead of each one having to remember it. Still overridable per field, e.g. `<Input autoCapitalize="words" />` for a name field.
- **`type="numeric"` buffers the raw typed text separately from the numeric `value`**, in `numeric/use-numeric-text.ts` — a `TextInput` controlled directly by `String(value)` can't represent in-progress input like `"1."` or a bare `"-"`. Non-digit characters are stripped as you type, and `onChange` only fires once the buffered text parses to a real number, clamped to `min`/`max`. The Showcase feeds the committed value back into the field so that clamp-and-resync path stays visible.
- Resyncing the buffered text when `value` changes from outside (e.g. that clamp round-trip above) happens **during render**, not in a `useEffect` — React's documented pattern for adjusting state from a prop change without an extra render pass. A `useEffect` calling `setState` synchronously in its body is also an ESLint error in this project's `react-hooks/set-state-in-effect` rule, which caught the first draft of this hook.
- Focus and disabled states are handled centrally — the field is outlined in `border`, and focus (or an error) thickens that outline and recolours it to `focus` (or `error`), taking the extra width out of the padding so nothing shifts; disabled controls use muted presentation without changing their public behavior.
- **The frame around the field is the public `FormField`** (`src/components/form-field`, below): every variation draws its label, helper and error through it, so a non-`Input` control framed by hand looks identical.
- **`required`** on `CommonInputProps` shows "Required" beside the label, and joins the field's accessible name ("Email, Required") because a screen reader never reaches the label's hint from inside the field. Anything not required is optional and gets no marker.
- **`type="textarea"`** is BaseInput told to be multiline: it starts `minLines` tall (3), grows with its text to `maxLines` (6), then scrolls — sized in lines of its own type step, so a larger OS text size makes a taller field rather than fewer visible lines. Return inserts a new line and never submits. With `maxLength` it shows "120/500" at the end of the helper row (read as "120 of 500 characters"); the limit is hard, so the count never goes over. Capitalisation and correction are back on here, because it's prose. Its vertical padding is derived, not fixed: whatever makes one line exactly `elementHeightMd` tall (never under `x4`), so a `minLines={1}` textarea sits level with 44pt buttons and single-line fields — Chat's composer next to its send button.
- **`error`/`helperText`**: `helperText` renders under the field in `theme.colors.textSecondary`; `error` (also a string) replaces it, renders in `theme.colors.error`, and switches the field's border to that color too (`error` — a new key in `palette.json`/`ThemeColors`, `#dc2626`/`#f87171` light/dark — same swap-the-palette-file extensibility as every other color). Both live on `CommonInputProps`, so every variation gets them for free. Verified live: an invalid `Email` value renders a red border and "Enter a valid email" in place of blank helper text.
- **Every typed field says what it holds.** `email` sends `autoComplete="email"` (React Native maps it to iOS's `textContentType="emailAddress"`). Left unlabelled, iOS guessed that the email field above a password was a login's username and put its Passwords bar over the keyboard. `password` sends `current-password`/`new-password`, `phone` sends `tel`, `code` sends the one-time-code hints.
- **`type="phone"` never shows a trunk prefix.** The picker already shows the calling code, so the field holds the digits that follow it: `66 588 9189` beside `+380`, not `066 588 9189` (`+380 066…` isn't a number). Digits typed without the `0` are grouped the way they follow the code internationally, since `AsYouType` only groups national input that includes it; a `0` that was typed is dropped once the number is complete. Plans without a trunk prefix keep their local grouping, `(213) 373-4253`. The reported value was always E.164 (`+380665889189`) either way.
- **`type="code"` can fix one character.** Tapping a filled box selects that character in the one invisible input, so the next one typed replaces it and backspace removes it (the rest shift left); tapping an empty box carries on from the end. The input itself takes no taps, so the caret is the component's state rather than wherever a tap landed in a zero-opacity field, and iOS's texted-code autofill still targets the single field.
- **`type="file"` is `FilePicker` behind a field.** It shows the chosen file's own `name`, never its `uri` — a cache path on native, a blob URL on web, meaningless to whoever reads the field — and falls back to the placeholder with nothing picked, the same shape `select` has. The picker is mounted _beside_ the field rather than around it: React Native has no touch bubbling, so a pressable field nested inside a pressable wrapper simply swallows every press. The field's `onPress` calls `FilePicker.open(id)` instead, which the bus delivers synchronously, so a browser still counts the press as the user activation that opened the dialog.
- **`type="color"` is `ColorPicker` in a sheet.** The field shows a swatch and the hex value; pressing it opens a bottom sheet with the picker, the optional `presets` and a hex field. Like `datetime`, every change stays in a draft and only "Done" calls `onChange`, always with `#RRGGBB` in upper case; Cancel, a backdrop tap, a drag down and the Android back button all leave the value alone. The hex field takes three or six digits, `#` optional, and only moves the picker once what's typed is a whole colour, so half a value mid-typing doesn't snap the square anywhere.
- **Ref forwarding**: typed variations forward their ref to the underlying RN `TextInput`, so a caller can use `.focus()`/`.blur()`. Press-mode variations such as select, datetime and color deliberately keep a null text-input ref because their value is picked rather than typed.
- **Accessibility**: the RN `TextInput` gets `accessibilityLabel={label ?? placeholder}` (a sibling `Text` isn't auto-associated with a field the way HTML's `<label for>` is) and `accessibilityState={{ disabled }}`, so a screen reader announces the field's name and disabled state without extra wiring per variation.
- **`onFocus`/`onBlur`** are plain optional callbacks on `CommonInputProps` — `BaseInput` still owns the focus-triggered background swap internally, but now also calls a consumer's `onFocus`/`onBlur` alongside it, e.g. for running validation when a field is left.
- `index.tsx`'s dispatch is a `switch` on `props.type`, but the actual `{...props}` spread appears exactly once, in a generic `renderVariant<P>(Component, props, ref)` helper each `case` calls — TS infers `P` from `Component` and checks the (already-narrowed-by-`switch`) `props` against it, so a mismatched case (e.g. the wrong variation under the wrong `case`) is still a `tsc` error, unlike an earlier version of this dispatcher that stored the picked component in an `any`-typed variable.
- Each input layer has its own Storybook story and Jest test, scoped to what that layer owns. `BaseInput` covers shared behavior once; variation tests cover only their value coercion and type-specific behavior; `Input` confirms routing.
- Live examples on the Showcase screen exercise every variation together, including numeric clamp-and-resync behavior, the actual `type="email"` DOM attribute, and ref-based imperative focus.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)
