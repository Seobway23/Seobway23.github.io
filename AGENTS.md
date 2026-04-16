# Agent instructions (ModernDevBlog)

Claude Code, Cursor, Antigravity, and other coding agents: when you **create or edit** `posts/**/*.md`, follow the same rules as this repo’s humans.

## Canonical docs (read in this order)

1. **`CLAUDE.md`** (repo root) — frontmatter, `## 참고` / `## 관련 글`, math, Mermaid, mechanics fences, glossary, **callouts**.
2. **`.cursor/skills/blog-post-writing/SKILL.md`** — workflow, presets, checklist, file paths.

For posts under `posts/study/mechanics/`, also read **`docs/mechanics-post-principles.md`**.

## Callouts (colored boxes) — use in long posts

Syntax (fence-like, but **three colons**):

```markdown
::: notice
독자가 놓치기 쉬운 **전제**나 **범위**를 짧게 적는다.
:::

::: tip
실무에서 **권장**하는 한 줄.
:::

::: success
단계 완료·검증 OK 같은 **긍정적 마무리**.
:::

::: warning
프로덕션·보안 등 **주의**.
:::
```

- First line: `::: lowercaseKind` only.
- Body: normal Markdown.
- Last line: `:::` alone.

**Supported kinds:** `tip`, `note`, `info`, `notice`, `success`, `important`, `warning`, `danger`, `caution`.

Implementation: `scripts/generate-posts-data.js` → HTML; colors: `src/index.css` (`.post-callout--*`).

**Habit:** For non-trivial articles, add at least one callout (e.g. `notice` + `tip` or `warning`) so key points scan well.

## After editing posts

Run **`npm run generate:posts`** so `public/posts.json` (and related JSON) updates locally; CI runs the same on push.
