# Market Launch 001 — Internet People

## The launch

Industry Next is not opening a résumé pile. It is opening two legible doors:

1. **Raise Your Hand 001** — choose one open role, name a real group, and propose a seven-day first proof.
2. **Internet People 001** — publish a Tumblr talent signal: what you make, what you teach, what you need, and what you could move in seven days.

Public doors:

- Work Market: <https://www.industrynext.xyz/market/>
- Three-minute application: <https://www.industrynext.xyz/market/apply/>
- Tumblr Talent Relay: <https://www.industrynext.xyz/market/tumblr/>
- Builder 001 brief: <https://www.industrynext.xyz/builders/001/>

The thesis: **the internet has plenty of talent and weak introductions.** A useful signal connects person → skill → seven-day move → collaboration need → first task.

## Tumblr launch post

**Title:** Internet People 001: the Tumblr Talent Relay

**Body:**

The internet is full of talent. Bad at introductions.

Make an original post that says:

- I MAKE…
- I CAN TEACH…
- I NEED…
- IN SEVEN DAYS, I COULD…

Tag it **#internet people 001**, **#industry next**, **#digital skills**, and **#tumblr talent relay**. Then reblog this invitation and tag two people whose strange digital skills deserve a better introduction.

Industry Next will read submitted posts, talk with strong fits, and—with explicit approval—turn selected signals into authored talent profiles connected to bounded work. A profile is never automatic. Terms are written before work.

Make the signal: <https://www.industrynext.xyz/market/tumblr/>

## Seven-day operating rhythm

| Day | Public move | Operating move |
| --- | --- | --- |
| Aug 1 | Publish the canonical relay invitation | Test both intake types; clear release QA data |
| Aug 2 | Reblog five strong public examples or adjacent practices | Respond to every credible signal inside 48 hours |
| Aug 3 | Publish one consented “signal anatomy” annotation | Move qualified signals to `conversation` |
| Aug 4 | Invite under-seen makers in two Tumblr communities | Match skills to one bounded first task |
| Aug 5 | Share one pairing: person + collaborator need | Write support and ownership terms before work |
| Aug 6 | Publish a first consented talent profile | Ask whether the person wants the relay passed onward |
| Aug 7–8 | Publish the week-one field note and next call | Select one funded builder or close the loop clearly |

## First 20 invitations

Invite practices, not follower counts. Start with two people in each category:

1. theme and CSS makers
2. archivists and digital librarians
3. GIF, collage, and fan-edit makers
4. music curators and micro-scene documentarians
5. game modders and interactive-fiction authors
6. accessibility tinkerers and caption artists
7. fandom organizers and community stewards
8. internet historians and lost-media detectives
9. toolmakers, bot artists, and data poets
10. educators who teach one strange useful digital move

Invitation copy:

> You have a skill the normal internet is bad at naming. Would you make an original Tumblr post for Internet People 001? Four prompts, no résumé: what you make, teach, need, and could move in seven days. I think your answer would help define the category.

Do not mass-message. Personalize the reason each person belongs in the relay.

## Week-one success

- 10 credible talent signals
- 3 real conversations
- 1 consented authored profile
- 1 funded builder or bounded first task
- 100% of submissions receive a human response or explicit close inside 48 hours

Traffic is not a participant count. Count submitted signals and conversations, not page views.

## Private intake desk

Applications live in the existing production KV namespace under private `market-application:` keys. The public endpoint accepts POST only; it exposes no list or read route. Each record expires after 90 days.

```sh
npm run market:intake -- list
npm run market:intake -- show <receipt-id>
npm run market:intake -- status <receipt-id> conversation
```

Statuses: `new`, `qualified`, `conversation`, `selected`, `declined`, `withdrawn`.

Review order:

1. Is there a specific, observable seven-day move?
2. Is a real person, group, archive, scene, or need present?
3. Can Industry Next provide a bounded task or useful introduction?
4. Are support, ownership, credit, safety, and any compensation terms explicit before work?

Do not copy application PII into public documents. Do not publish a talent profile from the checkbox alone: send the authored draft and receive explicit approval for that exact version.

## 48-hour reply shapes

**Conversation:** “Your signal reached us. The part we cannot stop thinking about is ____. Could we talk for 25 minutes about a seven-day proof with ____?”

**Need one detail:** “The skill is clear; the first move is not yet observable. What could another person see, use, or respond to after seven days?”

**Close:** “We read this. We do not have a responsible task or introduction for it right now, so we are closing the loop instead of keeping you in a maybe pile. Your post remains yours.”

## Boundaries

- AI credits are operating support, not cash compensation.
- No employment, contractor, ownership, or revenue-share term is implied.
- No Tumblr blog scraping; review only the submitted public post and links.
- No automatic profiles, acceptance, or matching.
- No follower-count ranking.
- No public inbox.
- No working trial without written terms.
- Delete or allow expiry after 90 days; honor withdrawal immediately.
