=====================================================================
TASK: CREATE WORKFLOWFE.md FOR FRONTEND IMPLEMENTATION
=====================================================================

You are working on a student course project called:

RuangTerbuka

Your task in this step is NOT to implement the frontend.

Your task is to create a new documentation file:

WORKFLOWFE.md

The purpose of WORKFLOWFE.md is to define a clear, sequential,
implementation workflow that another AI coding agent can follow later
to build the RuangTerbuka frontend.

WORKFLOWFE.md must act as the bridge between:

1. docs/structur.md
2. DESIGN.md
3. Public/web/RukaFinalFigma/

and the actual frontend implementation inside:

apps/web/

The workflow must tell a future AI Agent:

- what to read first
- what information to extract
- how to understand the existing project structure
- how to use DESIGN.md as the UI/design specification
- how to use the Figma screenshot folder as visual reference
- how to map screenshots to routes/pages
- how to create reusable components
- how to implement the pages in the correct order
- how to verify visual consistency
- how to avoid inventing features
- how to avoid modifying unrelated backend files
- how to validate the implementation before declaring completion

Do NOT implement any React component in this task.

Do NOT modify the frontend source code in this task.

Do NOT modify backend files.

Only create/update WORKFLOWFE.md.

=====================================================================
1. FIRST PRINCIPLE — UNDERSTAND THE PROJECT BEFORE CODING
=====================================================================

The future AI Agent must NEVER immediately start writing React code.

Before implementing anything, the agent must inspect the repository.

The agent must first understand:

- project root
- apps/
- apps/web/
- apps/web/src/
- apps/web/src/config/
- apps/web/src/routes/
- apps/web/src/layouts/
- apps/web/src/features/
- apps/web/src/components/
- apps/web/src/hooks/
- apps/web/src/context/
- apps/web/src/utils/
- apps/web/public/
- backend/
- docs/

The workflow must explicitly instruct the agent to inspect the
existing files before creating new files.

The agent must preserve the existing architecture unless a concrete
reason requires a change.

The agent must not restructure the project simply because another
structure seems cleaner.

The existing project structure is the baseline.

=====================================================================
2. THREE PRIMARY SOURCES OF TRUTH
=====================================================================

WORKFLOWFE.md must clearly establish the purpose of the three main
references.

---------------------------------------------------------------------
SOURCE A — docs/structur.md
---------------------------------------------------------------------

This document defines the technical project structure.

Use it to understand:

- directory hierarchy
- frontend location
- existing route structure
- layout structure
- feature organization
- config files
- shared component locations
- hooks
- context
- utilities
- backend boundaries

structur.md answers:

"WHERE should the frontend implementation live?"

It does NOT automatically define the exact visual appearance of the
interface.

Do not override the visual design based on assumptions from
structur.md.

---------------------------------------------------------------------
SOURCE B — DESIGN.md
---------------------------------------------------------------------

DESIGN.md defines the design system and the mapping between the
technical structure and visual UI.

Use DESIGN.md to understand:

- color tokens
- typography
- spacing
- border radius
- component tokens
- buttons
- inputs
- badges
- cards
- navigation
- tables
- timeline
- maps
- forms
- visual hierarchy
- component mapping
- known design mismatches
- UI recommendations

DESIGN.md answers:

"HOW should the frontend look and how should the UI components relate
to the application structure?"

The future AI Agent must read DESIGN.md before implementing the UI.

---------------------------------------------------------------------
SOURCE C — Public/web/RukaFinalFigma/
---------------------------------------------------------------------

This folder contains visual references from the Figma design.

The folder may contain:

- screenshots
- design system images
- individual page screenshots
- multiple visual states
- reference images

The future AI Agent must inspect the actual folder contents before
assuming exact filenames.

If the folder exists at a different capitalization or path, the agent
must locate the actual folder rather than inventing a path.

The screenshots are visual references.

They should be used to understand:

- page composition
- spacing
- proportions
- layout hierarchy
- card dimensions
- visual density
- placement of maps
- image usage
- typography hierarchy
- button positioning
- navigation
- sidebar structure
- status badges
- forms
- tables
- timeline
- empty states if present
- modal/dialog appearance if present

The agent must NOT blindly reproduce unrelated visual elements that
are not supported by DESIGN.md or the actual product requirements.

The screenshots answer:

"WHAT should the finished interface visually resemble?"

=====================================================================
3. SOURCE PRIORITY RULE
=====================================================================

WORKFLOWFE.md must establish a hierarchy for resolving conflicts.

Use the following priority:

1. Explicit current project requirements
2. DESIGN.md
3. Figma screenshots in RukaFinalFigma
4. docs/structur.md for technical architecture
5. Existing source code conventions
6. General UI assumptions

However, this hierarchy must be interpreted carefully.

Technical structure from structur.md should not be discarded just
because a screenshot looks different.

Likewise, screenshots should not be ignored just because the existing
code is currently empty.

If a conflict exists:

- identify it
- explain it
- choose the least destructive solution
- preserve the existing architecture where possible
- do not invent functionality

=====================================================================
4. PLATFORM NAME LOCK
=====================================================================

The platform name is ALWAYS:

RuangTerbuka

Never use:

- Raku
- Raku Jakarta
- RuangWarga
- RUKA
- generic names
- placeholder government platform names

The visible product branding must consistently use:

RuangTerbuka

This includes:

- navbar
- logo/wordmark
- page titles
- login pages
- government interface
- footer if present
- browser-facing application labels where applicable

If an old document contains another project name, do not propagate
that name into the frontend.

The agent must follow the current product naming used by the design.

=====================================================================
5. PRODUCT DIRECTION
=====================================================================

The frontend is NOT primarily a complaint/ticketing website.

RuangTerbuka is primarily a:

PUBLIC SPACE INFORMATION PLATFORM

The main experience is:

DISCOVER PUBLIC SPACE
        ↓
VIEW PUBLIC SPACE INFORMATION
        ↓
CHECK FACILITY CONDITIONS
        ↓
REPORT A PROBLEM IF NECESSARY
        ↓
MONITOR REPORT STATUS

The central product value is information about public spaces and their
facilities.

Reporting is an important secondary feature.

Therefore the frontend workflow must prioritize:

1. discovering public spaces
2. finding locations
3. understanding public space information
4. checking facility conditions
5. viewing facility details
6. reporting problems
7. monitoring reports

Do not let the reporting UI visually dominate the citizen experience.

Do not turn RuangTerbuka into an enterprise complaint-management
system.

=====================================================================
6. VISUAL DESIGN PRINCIPLE
=====================================================================

The future frontend must follow the design language documented in
DESIGN.md and represented by the Figma screenshots.

The interface should feel:

- modern
- civic
- clean
- trustworthy
- approachable
- professional
- accessible
- public-space oriented
- information oriented

Avoid:

- enterprise SaaS aesthetics
- dense ticketing dashboards
- dispatch-board layouts
- overly futuristic interfaces
- cyberpunk aesthetics
- excessive gradients
- excessive glassmorphism
- excessive shadows
- excessive colors
- generic government portal appearance
- generic Google Maps clone appearance

The government interface must remain simple and low-density.

It is a student MVP.

=====================================================================
7. MAP PRIORITY
=====================================================================

The map is a major part of the public-space discovery experience.

However, the map must not become the entire product.

The frontend should communicate:

"This is a public-space information platform that uses maps to help
citizens discover locations."

not:

"This is a map application."

For public-space discovery and detail pages, the map should receive
appropriate visual prominence.

When a public-space page contains both an image and a map, the agent
must follow the current Figma design and DESIGN.md.

If the design reference emphasizes the map, do not make the hero image
larger simply because large image cards are common in modern websites.

The information architecture must prioritize public-space information
over decorative imagery.

=====================================================================
8. FRONTEND-ONLY BOUNDARY
=====================================================================

WORKFLOWFE.md must explicitly state that the initial implementation
workflow is for:

FRONTEND ONLY

The agent should primarily work inside:

apps/web/

The agent must not:

- implement FastAPI endpoints
- redesign the backend
- create database migrations
- modify SQLAlchemy models
- modify backend authentication logic
- create API endpoints unless explicitly requested later
- restructure backend folders

If backend integration is not ready, use a clearly isolated mock data
layer or static data abstraction.

Do not hard-code mock data directly into dozens of UI components.

Prefer centralized mock data where appropriate.

=====================================================================
9. BEFORE IMPLEMENTATION — REPOSITORY AUDIT
=====================================================================

The workflow must require the future agent to perform an audit before
coding.

The audit should include:

Step 1:
Inspect the repository tree.

Step 2:
Read:

docs/structur.md

Step 3:
Locate and read:

DESIGN.md

Step 4:
Inspect:

Public/web/RukaFinalFigma/

or the actual location discovered in the repository.

Step 5:
Inspect:

apps/web/package.json

Step 6:
Inspect:

apps/web/vite.config.js

Step 7:
Inspect:

apps/web/src/main.jsx

Step 8:
Inspect:

apps/web/src/App.jsx

Step 9:
Inspect existing routing files.

Step 10:
Inspect existing layout files.

Step 11:
Inspect existing configuration files.

Step 12:
Check whether any frontend dependencies are already installed.

The agent must not install a new library before checking whether the
required capability already exists.

=====================================================================
10. CREATE AN IMPLEMENTATION INVENTORY
=====================================================================

Before writing code, the agent should create an internal inventory.

The inventory should contain:

- route
- page name
- user role
- screenshot reference
- layout type
- major sections
- reusable components
- data requirements
- interactive behavior
- responsive behavior
- dependencies
- implementation status

Example:

| # | Role | Page | Route | Reference | Status |
|---|---|---|---|---|---|
| 1 | Citizen | Login/Register | /login | Screenshot | Pending |
| 2 | Citizen | Beranda | /home | Screenshot | Pending |
| 3 | Citizen | Ruang Publik | /ruang-publik | Screenshot | Pending |
| 4 | Citizen | Detail Ruang Publik | /ruang-publik/:id | Screenshot | Pending |
| 5 | Citizen | Detail Fasilitas | /ruang-publik/:id/fasilitas/:facilityId | Screenshot | Pending |
| 6 | Citizen | Form Pelaporan | /ruang-publik/:id/lapor | Screenshot | Pending |
| 7 | Citizen | Detail Laporan | /laporan-saya/:id | Screenshot | Pending |
| 8 | Citizen | Laporan Saya | /laporan-saya | Screenshot | Pending |
| 9 | Government | Login Pemerintah | /login-pemerintah | Screenshot | Pending |
| 10 | Government | Dashboard | /dashboard | Screenshot | Pending |
| 11 | Government | Daftar Laporan | /dashboard/moderasi | Screenshot | Pending |
| 12 | Government | Detail Laporan | /dashboard/moderasi/:id | Screenshot | Pending |

The exact routes must be reconciled with the actual project
configuration and DESIGN.md before implementation.

Do not blindly assume routes if existing route configuration says
otherwise.

=====================================================================
11. PAGE COUNT
=====================================================================

The target design contains 12 primary screens.

Citizen:

1. Login / Register
2. Beranda
3. Daftar Ruang Publik
4. Detail Ruang Publik
5. Detail Fasilitas
6. Form Pelaporan
7. Detail Laporan / Status Laporan
8. Laporan Saya

Government:

9. Login Pemerintah
10. Dashboard Pemerintah
11. Daftar Laporan
12. Detail Laporan Pemerintah

The workflow must instruct the agent NOT to silently merge these pages.

Each screen represents a distinct route/view/state.

If some screens share components, they may reuse components, but they
must remain separate page-level views.

=====================================================================
12. IMPLEMENTATION ORDER
=====================================================================

The workflow must require implementation in logical dependency order.

Recommended order:

PHASE 1
Project foundation

PHASE 2
Design tokens

PHASE 3
Global reusable components

PHASE 4
Public layout

PHASE 5
Citizen authentication

PHASE 6
Citizen homepage

PHASE 7
Public-space discovery

PHASE 8
Public-space detail

PHASE 9
Facility detail

PHASE 10
Reporting form

PHASE 11
Report detail/status

PHASE 12
My reports

PHASE 13
Government authentication

PHASE 14
Government layout

PHASE 15
Government dashboard

PHASE 16
Government report list

PHASE 17
Government report detail

PHASE 18
Responsive refinement

PHASE 19
Visual verification

PHASE 20
Final cleanup

Do not jump directly to the government dashboard before the core
citizen experience is structurally implemented unless there is a
specific reason.

=====================================================================
13. DESIGN TOKENS FIRST
=====================================================================

Before creating page-specific styling, the agent must inspect
DESIGN.md and establish reusable design tokens.

Tokens should cover at minimum:

- primary color
- accent color
- info color
- success color
- warning color
- danger color
- neutral colors
- text colors
- background colors
- surface colors
- border colors
- typography
- spacing
- radius
- shadows where applicable

Use the values documented in DESIGN.md.

Do not randomly create alternative colors.

Do not introduce a second visual system.

Do not use arbitrary Tailwind values everywhere if a project-level
token can represent the same design decision.

=====================================================================
14. TYPOGRAPHY
=====================================================================

The design uses:

Plus Jakarta Sans

The workflow must instruct the agent to verify whether the font is
already available in the project.

If it is not available, implement it according to the project's
existing frontend conventions.

Typography hierarchy should remain consistent with DESIGN.md.

Do not randomly use:

- Inter
- Roboto
- Poppins
- Arial
- system fonts

unless there is a technical fallback requirement.

The visual hierarchy should preserve:

- page heading
- section heading
- subheading
- body
- secondary text
- caption

=====================================================================
15. SPACING
=====================================================================

Use the documented 4px-based spacing system.

Preferred values:

4
8
12
16
24
32
48
64

The agent must avoid arbitrary spacing values unless the screenshot
clearly requires a specific value and the deviation is justified.

Consistency is more important than pixel-perfect imitation of a
single screenshot.

=====================================================================
16. GLOBAL COMPONENT STRATEGY
=====================================================================

The future implementation should identify reusable components before
duplicating UI.

Core components include:

- Navbar
- Button
- Search Bar
- Category Chip
- Card
- Public Space Card
- Facility Card
- Status Badge
- Input
- Dropdown
- Filter
- Map Container
- Upload Image
- Report Form
- Statistic Card
- Data Table
- Timeline
- Modal

These should be implemented as reusable components where appropriate.

Do not create a separate almost-identical component for every page.

However, do not over-abstract simple components into an unnecessarily
complex design framework.

The goal is:

REUSABLE + SIMPLE + MAINTAINABLE

=====================================================================
17. COMPONENT-FIRST IMPLEMENTATION
=====================================================================

Before implementing pages, identify:

GLOBAL COMPONENTS

PUBLIC COMPONENTS

GOVERNMENT COMPONENTS

FEATURE-SPECIFIC COMPONENTS

For example:

Global:
- Button
- Badge
- Input
- Card

Public:
- PublicNavbar
- PublicSpaceCard
- FacilityCondition
- PublicSpaceMap

Government:
- AdminSidebar
- StatisticCard
- ReportTable
- ReportTimeline

Feature-specific:
- ReportForm
- ReportStatusTimeline

The exact file organization must follow the actual project structure
and DESIGN.md.

Do not invent an entirely different architecture without justification.

=====================================================================
18. PUBLIC LAYOUT
=====================================================================

Implement the citizen-facing shell consistently.

The public shell should contain the navigation required by the design.

The navbar should use:

RuangTerbuka

Navigation should follow the approved design.

Do not add unnecessary navigation items.

The login/register screen must be treated as an authentication page,
not as a normal content page.

If the Figma design shows a minimal authentication composition,
preserve that composition.

Do not automatically attach the full public footer to the
authentication screen if the reference design does not contain it.

=====================================================================
19. HOMEPAGE WORKFLOW
=====================================================================

The homepage must prioritize discovery.

The homepage should communicate:

"Find a public space and understand its facilities."

The implementation workflow must verify:

- hero
- search
- categories
- public-space discovery
- facility information
- supporting reporting CTA

Reporting should exist but should not dominate the homepage.

The "Bagaimana RuangTerbuka..." section must follow the current
approved design in DESIGN.md and the Figma reference.

If the current design has shifted toward discovery cards or public
space exploration, the agent must follow the latest design rather
than an obsolete version.

=====================================================================
20. PUBLIC SPACE DISCOVERY PAGE
=====================================================================

This page is one of the most important pages.

The workflow must instruct the agent to implement:

- search/discovery
- map
- public-space list
- filters
- public-space cards
- facility condition summaries

The map and list must feel balanced.

The map should not be a decorative afterthought.

The public-space cards should prioritize:

- photo
- name
- location
- category
- facility condition
- appropriate report information
- detail action

Do not add unsupported:

- ratings
- reviews
- visitor statistics
- sponsor badges
- advertisements
- popularity scores

=====================================================================
21. PUBLIC SPACE DETAIL
=====================================================================

The Detail Ruang Publik page is the primary information page.

The workflow must instruct the agent to prioritize:

1. location
2. map
3. public-space identity
4. description
5. facility conditions
6. facility information
7. supporting report information
8. reporting CTA

The visual composition must follow the Figma reference.

If the Figma reference emphasizes the map, preserve that hierarchy.

Do not make a large image dominate the page merely because the
screenshot contains an image.

The map is a functional information element.

The image is supporting context.

=====================================================================
22. FACILITY DETAIL
=====================================================================

Facility Detail is a distinct page/view.

It should focus on one facility.

The implementation must remain simple.

The page should contain only the information supported by the
approved specification and design.

Do not invent:

- asset IDs
- maintenance history
- installation dates
- vendors
- technicians
- internal government notes
- coordinate metadata

The main action should allow the citizen to report the facility issue.

=====================================================================
23. REPORTING FORM
=====================================================================

Reporting is secondary to facility discovery.

The form should be short.

The workflow must preserve the principle:

"Laporan bisa dibuat dalam <1 menit."

When arriving from a facility detail page, previously selected context
must be preserved.

For example:

Ruang Publik:
Taman Suropati

Fasilitas:
Penerangan

Do not force users to select the same information again.

The form must follow the approved field list.

Do not invent additional government-style fields.

=====================================================================
24. REPORT STATUS
=====================================================================

The report status page must use a simple timeline.

The expected progression is:

Dilaporkan
↓
Diverifikasi
↓
Dalam Penanganan
↓
Selesai

There may also be:

Ditolak + alasan

The workflow must ensure the implementation communicates:

- current status
- status progression
- update date/time
- rejection reason when applicable

Do not add:

- SLA countdown
- response-time targets
- performance percentages
- technician assignment
- internal audit logs
- asset codes

=====================================================================
25. MY REPORTS
=====================================================================

Laporan Saya should remain a supporting citizen feature.

It should show reports made by the current citizen.

The workflow should prioritize readability.

Do not turn it into an enterprise ticketing system.

Each report should link to the report detail/status page.

Use the approved status labels from DESIGN.md.

=====================================================================
26. GOVERNMENT LOGIN
=====================================================================

Government login must remain separate from the citizen authentication
experience if the approved design specifies separate access.

The government login should remain simple.

Do not introduce:

- enterprise SSO dashboards
- complicated security panels
- unnecessary authentication fields

Use only the fields required by the design/specification.

=====================================================================
27. GOVERNMENT LAYOUT
=====================================================================

Government interface uses the same design system.

It must NOT look like a completely different application.

Reuse:

- colors
- typography
- spacing
- buttons
- cards
- badges
- radius
- visual language

However, information architecture can differ because government users
have different tasks.

The government interface should remain low density.

=====================================================================
28. GOVERNMENT DASHBOARD
=====================================================================

The dashboard must focus on report monitoring.

Use the approved four statistic cards:

- Total Laporan
- Menunggu Verifikasi
- Dalam Penanganan
- Selesai

Additional dashboard content must follow the approved specification.

Do not add random enterprise dashboard widgets.

Do not add:

- SLA charts
- technician workload
- team performance
- dispatch queues
- target resolution charts
- operational command-center panels

=====================================================================
29. GOVERNMENT REPORT LIST
=====================================================================

The report list should provide a clear monitoring table.

Use the approved columns:

- Laporan
- Lokasi
- Fasilitas
- Tanggal
- Status
- Action

Filters should only exist where supported by the approved design.

Avoid turning the page into a giant administrative control panel.

=====================================================================
30. GOVERNMENT REPORT DETAIL
=====================================================================

This page is especially restricted.

The government report detail may show:

- reporter
- location
- facility
- report date
- description
- attached photo
- current status

Actions are limited to:

Verifikasi

Tandai Dalam Penanganan

Tandai Selesai

The workflow must explicitly prevent the agent from inventing:

- asset codes
- technician assignment
- field teams
- officer names
- SLA timers
- proof-of-repair upload
- internal officer notes
- coordinates
- geotag accuracy
- verified identity badges
- performance bars
- agency-specific workflow
- real government system references

=====================================================================
31. BANNED UI PATTERNS
=====================================================================

The future AI Agent must not create:

- SLA countdown components
- asset registration cards
- technician/team assignment panels
- verified identity badges
- coordinate precision panels
- GPS accuracy indicators
- proof-of-repair workflow
- officer audit logs
- dispatch boards
- field-service boards
- enterprise ticket queues
- operations-center layouts

These are explicitly outside the MVP scope.

=====================================================================
32. MOCK DATA STRATEGY
=====================================================================

If backend APIs are not available yet, the frontend may use mock data.

However:

Do not scatter mock objects throughout JSX.

Create a centralized mock data layer appropriate to the existing
project structure.

Mock data should represent:

- public spaces
- facilities
- facility conditions
- reports
- report statuses
- government dashboard statistics

Use realistic but clearly fictional/sample data.

Do not create fake real-world government agencies.

Do not invent officer/regu names.

Do not create asset codes.

=====================================================================
33. IMAGE STRATEGY
=====================================================================

The agent must inspect the actual RukaFinalFigma assets.

If screenshots include images that are not available as reusable
assets, the agent should determine an appropriate implementation
strategy without breaking the design.

Do not replace every visual with arbitrary stock images.

Do not make images larger than the approved composition.

For information-oriented pages, preserve the relationship between:

image
map
information
facility condition

The visual hierarchy must remain information-first.

=====================================================================
34. MAP IMPLEMENTATION
=====================================================================

If an actual map library already exists, reuse it.

If not, inspect package.json and project conventions before choosing a
library.

Do not add multiple map libraries.

Use one consistent map implementation.

The map should support the visual purpose of the mockup.

For the MVP, markers may use mock coordinates.

Do not display precise coordinate metadata in the UI.

Do not expose technical geolocation information unless explicitly
required by the approved design.

=====================================================================
35. ROUTING
=====================================================================

The agent must inspect:

apps/web/src/routes/

before implementing routes.

Do not blindly create a second routing architecture.

If route-config.js is intended to be the source of routes, use it.

If App.jsx currently renders route-config.js, preserve that pattern.

Authentication guards should remain compatible with:

RequireAuth.jsx

RequireAdmin.jsx

Do not implement a completely separate auth system inside individual
pages.

=====================================================================
36. AUTHENTICATION
=====================================================================

If backend authentication is not yet connected, create only the
frontend flow necessary for the UI.

Use a mock authentication state only if needed.

Keep authentication logic centralized.

Do not place authentication state directly inside every page.

Respect:

AuthContext.jsx

and existing architecture.

=====================================================================
37. STATE MANAGEMENT
=====================================================================

Do not introduce a large state-management library without need.

Use:

- local state
- context
- URL parameters
- existing project patterns

where sufficient.

The project is an MVP.

Avoid unnecessary architecture complexity.

=====================================================================
38. RESPONSIVE IMPLEMENTATION
=====================================================================

The design target is:

Desktop / laptop

Desktop is the primary visual reference.

However, the implementation must remain responsive.

At smaller widths:

- navbar can collapse
- map and list can stack
- cards can become one column
- tables can scroll horizontally
- forms remain usable
- buttons remain accessible

Do not redesign the desktop UI into a mobile-first layout.

Responsive behavior should preserve the original information hierarchy.

=====================================================================
39. ACCESSIBILITY
=====================================================================

The workflow must include accessibility verification.

Check:

- text contrast
- readable font sizes
- keyboard focus
- button labels
- semantic HTML
- alt text
- status text
- status icons
- status colors
- clickable target sizes
- form labels

Do not communicate status through color alone.

For example:

Good

must not be represented only by green.

Use:

icon + text + color

=====================================================================
40. VISUAL IMPLEMENTATION METHOD
=====================================================================

The future agent must use a screenshot-driven implementation process.

For each page:

1. Open the corresponding Figma screenshot.
2. Identify the page layout.
3. Identify major sections.
4. Identify reusable components.
5. Identify typography hierarchy.
6. Identify spacing.
7. Identify colors.
8. Identify borders/radius.
9. Identify image/map proportions.
10. Implement.
11. Render the page.
12. Compare the implementation with the reference.
13. Correct visual mismatches.
14. Repeat until reasonably aligned.

Do not consider a page finished merely because it compiles.

The page must also visually resemble the approved design.

=====================================================================
41. VISUAL COMPARISON CHECKLIST
=====================================================================

For every page compare:

LAYOUT

- overall page width
- content container
- section positioning
- columns
- card proportions
- map proportions
- image proportions

TYPOGRAPHY

- font family
- heading size
- body size
- weight
- line height

SPACING

- section gaps
- card padding
- button spacing
- input spacing
- grid gaps

COLOR

- background
- primary
- accent
- status colors
- text
- borders

COMPONENTS

- buttons
- cards
- badges
- inputs
- chips
- tables
- timeline

CONTENT

- heading text
- labels
- CTA text
- status text
- navigation labels

Do not change content simply to make the UI look nicer.

=====================================================================
42. PAGE COMPLETION RULE
=====================================================================

A page is considered complete only when:

- route works
- page renders
- no console errors
- no broken imports
- no missing assets that should exist
- layout matches design
- typography matches
- colors match
- spacing is consistent
- interactions work
- responsive behavior exists
- accessibility basics are satisfied
- no banned UI patterns were introduced

=====================================================================
43. PHASE GATES
=====================================================================

After each major phase, the agent must verify the result before
moving forward.

Example:

PHASE 1:
Foundation complete

Check:
- project runs
- dependencies work
- routes architecture understood

PHASE 2:
Design system complete

Check:
- tokens available
- typography configured
- colors consistent

PHASE 3:
Components complete

Check:
- components reusable
- no unnecessary duplication

PHASE 4:
Citizen shell complete

Check:
- navbar
- authentication
- page container

etc.

Do not continue indefinitely if a previous phase is broken.

Fix the foundation first.

=====================================================================
44. NO SILENT DEVIATION
=====================================================================

If the agent encounters a conflict between:

- DESIGN.md
- screenshot
- structur.md
- existing source code

it must not silently choose one.

The agent should document the conflict.

Use a short implementation note such as:

"Conflict:
DESIGN.md specifies X while existing route structure uses Y.

Decision:
Preserve Y because it is the current architectural contract and
implement X at the UI layer."

The goal is traceability.

=====================================================================
45. DO NOT INVENT FEATURES
=====================================================================

The future agent must follow a strict rule:

If a feature is not documented or visually supported, do not invent it.

Examples of features that should not appear automatically:

- ratings
- reviews
- favorites
- bookmarks
- notifications
- chat
- social sharing
- visitor statistics
- user reputation
- gamification
- loyalty points
- AI assistant
- recommendation engine
- SLA system
- technician assignment
- internal messaging
- advanced analytics
- audit log

The frontend is an MVP.

Simple is intentional.

=====================================================================
46. DATA DISPLAY RULE
=====================================================================

Every displayed data point should have a reason.

Before adding a UI field, ask:

1. Is it specified?
2. Is it in DESIGN.md?
3. Is it visible in the approved Figma reference?
4. Is it necessary for the user flow?

If the answer is no to all four:

Do not add it.

=====================================================================
47. REPORTING SHOULD NOT DOMINATE
=====================================================================

This is a critical product-design rule.

The platform is primarily about:

PUBLIC SPACE INFORMATION

not:

REPORT MANAGEMENT

Therefore:

Citizen homepage:
Discovery > reporting

Public-space list:
Locations + facilities > reports

Public-space detail:
Facilities + map + information > report CTA

Facility detail:
Facility condition > report CTA

Report form:
Simple and short

My Reports:
Secondary navigation destination

Government:
Reports become more important because that is the government user's
primary workflow.

This distinction must remain visible in the implementation.

=====================================================================
48. GOVERNMENT VS CITIZEN INFORMATION DENSITY
=====================================================================

Citizen pages:

Low cognitive load

Government pages:

Moderate information density

But neither side should become excessively dense.

Citizen:
"What can I find here?"

Government:
"What reports need attention?"

Both should remain readable.

=====================================================================
49. CODE QUALITY RULES
=====================================================================

The future agent should:

- use clear component names
- use clear variable names
- avoid giant components
- avoid duplicated JSX
- avoid inline magic values where tokens exist
- avoid unnecessary dependencies
- keep feature boundaries understandable
- keep mock data centralized
- keep routing centralized
- keep authentication centralized
- reuse design components

Do not optimize prematurely.

Readable student-project code is preferred over unnecessary
architectural sophistication.

=====================================================================
50. FILE ORGANIZATION
=====================================================================

The future agent must use the structure defined by:

docs/structur.md

If feature folders need to be created, organize them according to the
existing feature-based architecture.

For example, conceptually:

features/
├── ruang-publik/
├── laporan/
├── auth/
└── moderasi/

But the exact final structure must be determined from the actual
repository and DESIGN.md.

Do not blindly copy this example if the repository has already
established another convention.

=====================================================================
51. DESIGN SYSTEM CONSISTENCY
=====================================================================

All pages must look like one product.

Do not allow:

Citizen pages:
one visual style

Government pages:
completely different visual style

Instead:

Same:
- typography
- colors
- radius
- buttons
- badges
- cards
- spacing

Different:
- information architecture
- navigation
- page purpose
- density appropriate to role

=====================================================================
52. COMPONENT REUSE CHECK
=====================================================================

Before creating a new component, the agent must ask:

"Does an existing component already solve this?"

If yes:
reuse it.

If almost the same:
consider extending it.

If fundamentally different:
create a new component.

Avoid component proliferation.

=====================================================================
53. FINAL ROUTE AUDIT
=====================================================================

After implementation, verify every required screen exists.

Citizen:

1. Login/Register
2. Beranda
3. Daftar Ruang Publik
4. Detail Ruang Publik
5. Detail Fasilitas
6. Form Pelaporan
7. Detail Laporan
8. Laporan Saya

Government:

9. Login Pemerintah
10. Dashboard Pemerintah
11. Daftar Laporan
12. Detail Laporan Pemerintah

The agent must test navigation between them.

=====================================================================
54. FINAL INTERACTION AUDIT
=====================================================================

Verify at minimum:

Homepage search
↓
Public-space discovery

Discovery
↓
Public-space detail

Public-space detail
↓
Facility detail

Facility detail
↓
Report form

Report form
↓
Report status

Report status
↓
My reports

Government login
↓
Dashboard

Dashboard
↓
Report list

Report list
↓
Report detail

Report detail
↓
Status action

The click-through experience must feel coherent.

=====================================================================
55. FINAL VISUAL AUDIT
=====================================================================

The agent must compare all implemented pages against the Figma
screenshots.

At minimum verify:

- overall composition
- map prominence
- image size
- card layout
- typography
- colors
- spacing
- navigation
- status badges
- buttons
- forms
- tables
- timeline

Particular attention must be given to the public-space information
pages.

The agent must ensure that the design does not accidentally become
"image-heavy" when the intended product hierarchy is
information-oriented.

=====================================================================
56. FINAL BANNED-FEATURE AUDIT
=====================================================================

Before completion, search the frontend source for signs of:

- SLA
- countdown
- target resolution time
- asset code
- technician
- field team
- regu
- verified identity
- coordinate precision
- GPS accuracy
- proof of repair
- performance percentage
- dispatch
- ticket queue

If any appear, determine whether they are explicitly required.

If not explicitly required:

remove them.

=====================================================================
57. FINAL BRAND AUDIT
=====================================================================

Search the frontend source for old branding.

Check for:

Raku

Raku Jakarta

RuangWarga

RUKA

other unintended project names

Every visible product brand must be:

RuangTerbuka

=====================================================================
58. FINAL QUALITY CHECK
=====================================================================

Before declaring the frontend complete, verify:

1. npm/build command works
2. development server works
3. no unresolved imports
4. no broken routes
5. no console errors
6. no missing critical assets
7. responsive layout works
8. accessibility basics work
9. design tokens are consistent
10. screenshots were visually compared
11. all 12 screens exist
12. navigation works
13. banned features are absent
14. branding is correct
15. public-space information remains the dominant citizen experience

=====================================================================
59. REQUIRED WORKFLOW DOCUMENT STRUCTURE
=====================================================================

The generated WORKFLOWFE.md itself must use the following structure:

# WORKFLOWFE.md

## 1. Purpose

Explain why this workflow exists.

## 2. Frontend Scope

Define what the agent is and is not allowed to implement.

## 3. Sources of Truth

Explain:

- docs/structur.md
- DESIGN.md
- RukaFinalFigma

## 4. Source Priority & Conflict Resolution

Explain how conflicts should be handled.

## 5. Product Direction

Explain that RuangTerbuka is primarily a public-space information
platform.

## 6. Repository Audit

Define the mandatory pre-coding inspection.

## 7. Design Audit

Define how DESIGN.md and screenshots must be analyzed.

## 8. Implementation Inventory

Define the required page/component inventory.

## 9. Design Token Setup

Define how colors, typography, spacing, radius, etc. are established.

## 10. Component Implementation

Define reusable component strategy.

## 11. Routing & Layout

Define how public/admin layouts and routes should be implemented.

## 12. Citizen Implementation Workflow

Define the sequence for the eight citizen screens.

## 13. Government Implementation Workflow

Define the sequence for the four government screens.

## 14. Mock Data Strategy

Define how mock data should be organized.

## 15. Interaction Workflow

Define expected click-through flows.

## 16. Responsive Implementation

Define desktop-first responsive behavior.

## 17. Accessibility

Define accessibility requirements.

## 18. Visual Verification

Define screenshot comparison methodology.

## 19. Phase Gates

Define when the agent may proceed to the next phase.

## 20. Conflict & Deviation Log

Define how deviations are documented.

## 21. Forbidden Features

Define explicitly banned UI/features.

## 22. Final QA Checklist

Define final technical and visual checks.

## 23. Completion Criteria

Define what "frontend complete" means.

=====================================================================
60. IMPORTANT — DO NOT OVERENGINEER THE WORKFLOW
=====================================================================

WORKFLOWFE.md is an instruction document for an AI coding agent.

It should be detailed enough to prevent mistakes but should not
mandate unnecessary software architecture.

Do not require:

- microservices
- advanced state management
- complex testing infrastructure
- unnecessary abstraction layers
- unnecessary libraries
- backend implementation
- production-grade enterprise architecture

This is a student project MVP.

The workflow should optimize for:

CLARITY
CONSISTENCY
VISUAL ACCURACY
MAINTAINABILITY
SIMPLE IMPLEMENTATION

=====================================================================
61. IMPORTANT — DO NOT IMPLEMENT CODE
=====================================================================

This task is ONLY:

CREATE WORKFLOWFE.md

Do not:

- create React pages
- create components
- modify App.jsx
- modify routes
- modify layouts
- install dependencies
- modify backend
- modify package.json
- create API endpoints

The only implementation artifact expected from this task is:

WORKFLOWFE.md

=====================================================================
62. FINAL OUTPUT REQUIREMENT
=====================================================================

After analyzing the repository, create:

WORKFLOWFE.md

at the project root:

raku-jakarta/
└── WORKFLOWFE.md

The document must be written for another AI coding agent.

It must be actionable.

It must contain explicit:

- phases
- dependencies
- implementation order
- verification steps
- source references
- page mapping
- component strategy
- visual verification
- forbidden features
- completion criteria

Do not merely summarize the project.

WORKFLOWFE.md must tell the future coding agent HOW TO WORK.

=====================================================================
63. FINAL MENTAL MODEL
=====================================================================

The future AI Agent should follow this mental model:

STRUCTURE
    ↓
docs/structur.md
    ↓
Understand where the frontend belongs
    ↓
DESIGN
    ↓
DESIGN.md
    ↓
Understand how the interface should behave/look
    ↓
VISUAL REFERENCE
    ↓
RukaFinalFigma
    ↓
Understand what the finished screens should resemble
    ↓
IMPLEMENT
    ↓
apps/web/
    ↓
VERIFY
    ↓
Compare implementation against DESIGN.md + Figma
    ↓
REFINE
    ↓
Run final QA
    ↓
DONE

The agent must NOT skip directly from:

"repository"

to:

"write React code".

The intended process is:

READ
→ UNDERSTAND
→ MAP
→ PLAN
→ IMPLEMENT
→ VERIFY
→ REFINE
→ COMPLETE

=====================================================================
END OF TASK
=====================================================================