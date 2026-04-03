# Blog Post Template

> **Copy this file** to create a new post. Rename it to your slug (e.g. `my-new-post.md`) and add a matching entry to `posts.json`.

## Section Heading

Write your introduction here. Keep it concise — two or three sentences that set context for the reader.

### Subsection

You can nest headings up to `####` for detailed breakdowns.

## Text Formatting

Here's a showcase of inline formatting:

- **Bold text** for emphasis
- _Italic text_ for nuance
- `inline code` for technical terms
- ~~Strikethrough~~ for corrections
- [Links](/blog) work too

## Lists

### Unordered

- First item
- Second item
  - Nested item
  - Another nested item
- Third item

### Ordered

1. Step one
2. Step two
3. Step three

## Code Blocks

### TypeScript

```typescript
interface PipelineConfig {
  name: string;
  stages: Stage[];
  timeout: number;
}

function runPipeline(config: PipelineConfig): Promise<void> {
  console.log(`Running pipeline: ${config.name}`);
  return executeStages(config.stages);
}
```

### Shell

```bash
#!/bin/bash
echo "Deploying to production..."
kubectl apply -f k8s/
kubectl rollout status deployment/app
echo "Deploy complete."
```

### JSON

```json
{
  "slug": "my-new-post",
  "title": "My New Post",
  "date": "2026-04-01",
  "excerpt": "A short description of what this post covers.",
  "tags": ["Angular", "DevOps"],
  "readingTime": "5 min"
}
```

## Blockquotes

> This is a blockquote. Use it for callouts, quotes, or important notes.
>
> It can span multiple lines.

## Tables

| Feature             | Status | Notes              |
| ------------------- | ------ | ------------------ |
| Markdown rendering  | Done   | Using `marked`     |
| Syntax highlighting | Done   | Via `highlight.js` |
| Dark/Light themes   | Done   | Fully token-aware  |

## Horizontal Rule

Use three dashes to create a separator:

---

## Images

Images can be added with standard Markdown syntax:

```markdown
![Alt text](/assets/images/screenshot.png)
```

## Checklist (GitHub-Flavored)

- [x] Create the markdown file
- [x] Add entry to `posts.json`
- [ ] Write the actual content
- [ ] Proofread and publish

---

_That's the template. Delete everything above your first heading and start writing!_
