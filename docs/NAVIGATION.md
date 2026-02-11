# Navigation and reachability

This document describes how users reach every page or screen in Agora (web and mobile). The rule of thumb: **every non-deep-link page is reachable in at most a few interactions** from an entry screen (home or a primary tab).

## Web routes and how to reach them

### Top-level header sections

- **Aujourd'hui** → `/`
- **Votes** → dropdown with:
  - Tous les scrutins → `/votes`
  - Prochains votes → `/votes/upcoming`
  - Votes par député → `/votes/deputy`
- **Calendrier** → `/timeline`
- **Explorer** → dropdown with:
  - Textes → `/bills`
  - Groupes politiques → `/groupes`
  - Mon député → `/mon-depute`
  - Circonscriptions → `/circonscriptions`
  - Recherche → `/search`
- **À propos** → `/about` (dropdown item: Sources de données → `/sources`)

### Routes table

| Route | How to reach it |
|-------|------------------|
| `/` | Header: Aujourd'hui; footer |
| `/timeline` | Header: Calendrier |
| `/votes` | Header: Votes → Tous les scrutins; home CTA "Comprendre les votes d'aujourd'hui"; timeline "Voir les scrutins" (with `?date=`) |
| `/votes/upcoming` | Header: Votes → Prochains votes |
| `/votes/deputy` | Header: Votes → Votes par député |
| `/votes/[id]` | From `/votes` list; from sitting detail "Scrutins de cette séance"; from search; from deputy profile; from bill detail |
| `/votes/deputy/[acteurRef]` | From scrutin detail (deputy list); from header "Votes par député" then search; from `/deputy/[acteurRef]` |
| `/sitting/[id]` | From `/` (agenda cards); from `/timeline` (day sittings); from scrutin detail "Séance" link |
| `/bills` | Header: Explorer → Textes |
| `/bills/[id]` | From bills list; from scrutin detail "Texte concerné" |
| `/groupes` | Header: Explorer → Groupes politiques |
| `/groupes/[slug]` | From groupes list; from scrutin "Comment chaque groupe a voté"; from deputy profile |
| `/mon-depute` | Header: Explorer → Mon député |
| `/circonscriptions` | Header: Explorer → Circonscriptions |
| `/circonscriptions/[id]` | From circonscriptions list |
| `/deputy/[acteurRef]` | From mon-depute (deputy card); from scrutin detail (deputy list); from search; from group detail |
| `/search` | Header: Explorer → Recherche |
| `/about` | Header: À propos; footer |
| `/sources` | Header: À propos → Sources de données; footer; scrutin detail "Comment lire un scrutin ?" |

All web pages share the same **header** (main nav) and **footer**, so users can jump to any primary section from anywhere.

## Mobile screens and how to reach them

| Screen | How to reach it |
|--------|------------------|
| (tabs) Aujourd'hui | Tab bar |
| (tabs) Scrutins | Tab bar |
| (tabs) Calendrier | Tab bar |
| (tabs) Explorer | Tab bar |
| (tabs) À propos | Tab bar |
| (tabs) Mon député | Explorer hub → Mon député |
| (tabs) Groupes | Explorer hub → Groupes politiques |
| (tabs) Circonscriptions | Explorer hub → Circonscriptions |
| `/sitting/[id]` | Today tab (sitting cards); Timeline tab (sitting cards) |
| `/votes/[id]` | Scrutins tab (scrutin cards); sitting detail "Scrutins de cette séance"; push notification |
| `/votes/deputy/[acteurRef]` | Deputy profile "Historique des votes"; Mon député → deputy card |
| `/deputy/[acteurRef]` | Mon député → deputy card; scrutin detail deputy list; group detail |
| `/groupes/[slug]` | Groupes tab → group card |
| `/circonscriptions/[id]` or `[slug]` | Circonscriptions tab → district |
| `/sources` | À propos tab → "Sources, méthodologie et glossaire" |

Deep links: `/votes?date=YYYY-MM-DD` and `/votes?tag=...` are supported on the Scrutins tab. Push notifications can open `/votes` or `/votes/[id]`.

## Key user journeys (votes)

1. **Today’s votes**: Home → "Comprendre les votes d'aujourd'hui" → Scrutins list (today) → scrutin detail. Or Timeline → "Voir les scrutins" for a day → scrutin detail.
2. **Explore past votes**: Header Scrutins → week/month list → filters (tag, group) → scrutin detail → deputy/group/bill/sitting/sources as needed.
3. **How a deputy or group votes**: Mon député / Groupes (or Explorer on mobile) → select deputy or group → "Historique des votes" or group votes → scrutin detail.
