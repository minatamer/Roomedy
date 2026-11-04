<h1 align="center">Roomedy</h1>

<p align="center">
  <strong>Your room. A fresh perspective. A plan to make it yours.</strong>
</p>

<p align="center">
  <a href="https://roomedy-frontend-860563209111.europe-west1.run.app"><strong>Try the hosted demo</strong></a>
  · <a href="#the-experience">The experience</a>
  · <a href="#run-locally">Run locally</a>
  · <a href="docs/README.md">Documentation</a>
</p>

<p align="center">
  <img src="docs/assets/roomedy-overview.png" width="900"
    alt="Roomedy editorial artwork: a warm room cutaway and Medy beside the words Your room. Together." />
</p>

Roomedy turns a few room photos into an editable 2D and 3D studio. Arrange furniture, explore materials and lighting, then find products and bring the costs together—with **Medy** beside you through the design and shopping conversations.

Start with your own photos, explore the supplied room photos, or build a room manually. The demo focuses on furnishing and finishing rectangular bedrooms and home offices.

## The experience

| Start with | Make it yours |
| --- | --- |
| **Your room** | Add photos or choose a manual starting point. Recognition drafts supported furniture and room features into a planning layout. |
| **Your design** | Move and rotate furniture in 2D, inspect the room in 3D, and edit finishes, bedding, mirrors, lighting and room surfaces. Switch between day and night. |
| **Your conversation** | Ask Medy for advice or a supported change. Review a preview before Apply, and use Undo to reverse an accepted change. |
| **Your shopping plan** | Find options for the listed furniture, flooring and walls. Compare the returned cards, choose products in any order and review prices, quantities and sources. |
| **Your takeaway** | Save reviewed estimates, download a visual PDF or export an editable project and supported 3D formats. Continue saved room restores the design and both conversations in the same tab. |

## From photos to a room plan

1. **Bring the room into view** — choose still JPEG, PNG or WebP photos, use the examples, or start manually.
2. **Explore the studio** — inspect the planning layout in 2D and 3D, correct measurements and customize the room.
3. **Design with Medy** — discuss the current room and review proposed changes before applying them.
4. **Find and compare** — search the room's shopping list and inspect product options, source links and recorded prices.
5. **Review and export** — check the breakdown, save a planning estimate and download the design or shopping plan.

Photo layouts are approximate illustrations. Verify measurements, clearances, product variants, quantities and supplier terms before purchasing or carrying out work.

## Built around a reviewable room

- **One accepted design:** manual edits and Medy proposals share the same room, preview, Apply and Undo authority.
- **Connected design and costs:** quantities and estimates follow accepted room data and chosen products; missing prices remain visible.
- **Useful source evidence:** product cards retain links, price context and available specifications without inventing missing coverage or dimensions.
- **Bounded photo processing:** up to **six photos**, **8 MiB each** and **24 MiB combined**, with pixel, preparation, server request and processing limits beyond the file picker.
- **Temporary sessions:** same-tab recovery keeps the room and both chats within the original **two-hour** session. Original photos and pending operations are excluded; downloaded project files remain separate and chat-free.

## Under the hood

| Layer | Technology |
| --- | --- |
| Experience | Next.js, React and TypeScript |
| Room views | SVG 2D plan, Three.js and React Three Fiber |
| Private API | Node.js and Express |
| Shared contracts | Zod schemas and a pure spatial/estimate package |
| Recognition and Medy | Server-only OpenAI Responses adapter with validated structured output |
| Product research | Bounded web research, source validation and deterministic estimate calculations |
| Exports | Visual PDFs, editable JSON projects, GLB and OBJ/MTL |
| Abuse protection | Cloudflare Turnstile, input-bound single-use grants and finite admission/resource limits |

```text
Browser
  └─ Next.js studio + Medy + shopping plan
       ├─ shared browser-safe contracts and spatial rules
       └─ fixed same-origin API bridge
            └─ private Express API
                 ├─ recognition and assistant adapters
                 └─ product research and source validation
```

The model proposes bounded data. Application code validates it and owns geometry, quantities, prices and accepted changes.

## Run locally

Use **Node 24.19.0** and **pnpm 11.25.0**. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build:shared
```

Start the backend and frontend in separate terminals:

```sh
pnpm dev:backend
```

```sh
pnpm dev:frontend
```

Open [Roomedy on port 4320](http://127.0.0.1:4320). Backend liveness is available at [port 4321 /v1/health](http://127.0.0.1:4321/v1/health).

An unconfigured checkout defaults to fake mode with paid operations off. The manual studio needs no provider key; protected API operations additionally require matching private bridge configuration. Optional configuration loads from ignored app-local `.env.local` files; committed `.env.example` files contain safe defaults and blank secret fields. Existing local configuration takes precedence. See the [backend](apps/backend/README.md) and [frontend](apps/frontend/README.md) guides for setup and live prerequisites.

Keep the dedicated ports and stop only the owning Roomedy process tree when restarting. Development uses `.next-dev`, separate from production `.next` output.

### Quality checks

```sh
pnpm check
```

This runs formatting, lint, strict app/test types, import boundaries, isolated unpaid unit tests and both production builds. The test launcher forces fake/paid-off settings and blocks external requests. The [validation records](docs/validation) distinguish actual checks from unperformed acceptance.

## Project guide

| Read | For |
| --- | --- |
| [Frontend](apps/frontend/README.md) · [Backend](apps/backend/README.md) | Setup, commands and runtime boundaries |
| [Documentation map](docs/README.md) · [Product blueprint](docs/ROOMEDY.md) · [Visual overview](docs/ROOMEDY_OVERVIEW.html) | Product scope, architecture and design story |
| [Photo intake](docs/engineering/image-intake.md) · [Provider safety](docs/engineering/provider-safety.md) | Image preparation, limits and protected AI operations |
| [Public-source review](docs/security/PUBLIC_REPOSITORY_REVIEW.md) · [Security review](docs/security/DEPLOYMENT_SECURITY_REVIEW.md) | Secret-scan scope, upload protections and dated security findings |
| [Tickets](docs/tickets/README.md) · [Validation](docs/validation) | Implementation decisions, evidence and limitations |
| [Deployment preparation](docs/operations/DEPLOYMENT_PREPARATION_HANDOFF.md) · [Hosted releases](docs/operations/HOSTED_ACCEPTANCE.md) | Local readiness and the separately recorded deployed revision |

This README describes the current source. The hosted link may run an earlier revision; local validation does not establish that the latest changes have been deployed.

Roomedy is a portfolio demonstration. Real room photos, credentials, private conversations and local diagnostic/export artifacts must stay out of version control. Only supported still-image intake is provided; floor-plan, drawing and PDF intake are outside the demo's scope.

<p align="center">
  Built and maintained by <a href="https://github.com/minatamer">Mina Tamer</a>.
</p>
