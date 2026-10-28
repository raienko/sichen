[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › App services

# Validation

> Field rules for zod schemas, with messages in every language.

<sub>`src/features/validation` · Tests: [`index.test.ts`](index.test.ts)</sub>

```ts
import { matches, rules, z } from "@/features/validation";

const signUp = matches(
  z.object({
    name: rules.name(),
    email: rules.email(),
    phone: rules.phone(),
    password: rules.password({ min: 10, symbol: true }),
    confirm: z.string(),
    website: rules.optional(rules.url()),
  }),
  "password",
  "confirm",
);
```

| Rule                                                                 | Checks                                                                                                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `required()`                                                         | not blank (spaces alone don't count)                                                                                                                   |
| `email()`                                                            | `something@something.tld`, no spaces. Practical, not RFC-complete: the server is the real judge                                                        |
| `password({ min = 8, letter = true, digit = true, symbol = false })` | length plus the character classes asked for. Letters in any script count. Not trimmed, since spaces in a password are deliberate                       |
| `name({ min = 2, max = 50 })`                                        | letters in any script, spaces, `'`, `-` and `.`; no digits or symbols                                                                                  |
| `phone(country?)`                                                    | a valid number for its country, via `libphonenumber-js`. Expects international format (`+380…`, what the phone input stores) unless `country` is given |
| `url()`                                                              | an `http(s)` address                                                                                                                                   |
| `length({ min, max })`                                               | text length after trimming                                                                                                                             |
| `optional(rule)`                                                     | empty passes; anything typed is checked by `rule`                                                                                                      |
| `matches(schema, "password", "confirm")`                             | two fields equal; reported on the second one, where the user looks                                                                                     |

- **Everything except the password is trimmed**, so `" ada@example.com "` passes and arrives trimmed.
- **Messages are translation keys**, not text: `validation.email`, or `validation.tooShort?{"min":2}` when there's a value to fill in. `errorText(message, t)` turns one into text in the active language. `FormInput` does this for you, so a form re-renders its errors in the new language when the language changes.
- **zod is re-exported** (`z`) so a schema needs one import.

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)
