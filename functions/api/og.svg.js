import { getRoomSnapshot, sanitizeRoomId } from "../_lib/jam-store.js";
import {
  buildRoomMeta,
  buildRoomPrimaryLine,
  buildRoomSecondaryLine,
  computeRoomTelemetry,
  escapeHtml,
  formatCompact,
  formatCount,
  formatMultiplier,
  titleCase,
} from "../../shared/drum-jam-telemetry.js";

function renderParticipantDots(count) {
  const visibleCount = Math.max(1, Math.min(10, count || 1));
  const dots = [];

  for (let index = 0; index < visibleCount; index += 1) {
    const x = 760 + (index % 5) * 48;
    const y = 132 + Math.floor(index / 5) * 48;
    const fill = index % 2 === 0 ? "#52E4DC" : "#FF7A1A";
    dots.push(`<circle cx="${x}" cy="${y}" r="15" fill="${fill}" fill-opacity="0.95" />`);
    dots.push(
      `<rect x="${x - 10}" y="${y - 8}" width="8" height="6" rx="2.4" fill="#F7F3EC" />
       <rect x="${x + 2}" y="${y - 8}" width="8" height="6" rx="2.4" fill="#F7F3EC" />
       <rect x="${x - 2}" y="${y - 6}" width="4" height="2.5" rx="1.2" fill="#F7F3EC" />`,
    );
  }

  return dots.join("");
}

function renderBars(players) {
  const topPlayers = players.slice(0, 4);
  const topValue = Math.max(1, topPlayers[0]?.totalTokens || 1);

  return topPlayers
    .map((player, index) => {
      const width = Math.max(18, Math.round((player.totalTokens / topValue) * 230));
      const y = 430 + index * 38;
      const fill = index === 0 ? "url(#barLead)" : "url(#barOther)";

      return `
        <text x="70" y="${y}" fill="#D2DBE8" font-size="20" font-weight="700">${escapeHtml(player.name)}</text>
        <text x="318" y="${y}" fill="#8FA0B6" font-size="18">${formatCount(player.totalTokens)} DRUM</text>
        <rect x="462" y="${y - 18}" width="248" height="16" rx="8" fill="#FFFFFF" fill-opacity="0.08" />
        <rect x="462" y="${y - 18}" width="${width}" height="16" rx="8" fill="${fill}" />
      `;
    })
    .join("");
}

function renderSvg(snapshot, roomId) {
  const telemetry = computeRoomTelemetry(snapshot);
  const meta = buildRoomMeta(snapshot, roomId);
  const participantsLabel = telemetry.participantCount === 1 ? "participant" : "participants";
  const primaryLine = buildRoomPrimaryLine(snapshot, telemetry);
  const secondaryLine = buildRoomSecondaryLine(snapshot, telemetry);
  const latestEvent = snapshot.events[0]?.message || "No tape yet. The next drummer gets the opener.";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="70" y1="40" x2="1110" y2="620" gradientUnits="userSpaceOnUse">
      <stop stop-color="#182130" />
      <stop offset="0.55" stop-color="#10161F" />
      <stop offset="1" stop-color="#0D121A" />
    </linearGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="#1B2432" />
      <stop offset="1" stop-color="#121923" />
    </linearGradient>
    <linearGradient id="accent" x1="100" y1="0" x2="1110" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#52E4DC" stop-opacity="0.26" />
      <stop offset="1" stop-color="#FF7A1A" stop-opacity="0.18" />
    </linearGradient>
    <linearGradient id="barLead" x1="462" y1="0" x2="710" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="#52E4DC" />
      <stop offset="1" stop-color="#7AF09B" />
    </linearGradient>
    <linearGradient id="barOther" x1="462" y1="0" x2="710" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FF7A1A" />
      <stop offset="1" stop-color="#FFCF72" />
    </linearGradient>
    <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
      <path d="M36 0H0V36" stroke="#FFFFFF" stroke-opacity="0.05" />
    </pattern>
  </defs>
  <rect width="1200" height="630" rx="36" fill="url(#bg)" />
  <rect width="1200" height="630" rx="36" fill="url(#grid)" />
  <rect width="1200" height="630" rx="36" fill="url(#accent)" />

  <rect x="40" y="36" width="1120" height="558" rx="30" fill="#0F151E" fill-opacity="0.72" stroke="#FFFFFF" stroke-opacity="0.1" />

  <text x="72" y="88" fill="#FFCF72" font-size="18" font-family="'IBM Plex Mono', monospace" font-weight="700" letter-spacing="2.4">INDUSTRY NEXT / LIVE ROOM</text>
  <rect x="895" y="58" width="233" height="42" rx="21" fill="#182130" stroke="#FFFFFF" stroke-opacity="0.12" />
  <text x="918" y="85" fill="#F7F3EC" font-size="18" font-family="'IBM Plex Mono', monospace" font-weight="700">/${escapeHtml(roomId)}</text>

  <text x="72" y="168" fill="#F7F3EC" font-size="60" font-family="system-ui, sans-serif" font-weight="800">Drum Nouns Jam</text>
  <text x="72" y="226" fill="#52E4DC" font-size="34" font-family="system-ui, sans-serif" font-weight="760">${escapeHtml(primaryLine)}</text>
  <text x="72" y="276" fill="#C9D4E3" font-size="24" font-family="system-ui, sans-serif" font-weight="520">${escapeHtml(secondaryLine)}</text>

  <g>
    <rect x="72" y="320" width="286" height="106" rx="20" fill="url(#panel)" stroke="#FFFFFF" stroke-opacity="0.08" />
    <text x="96" y="354" fill="#8FA0B6" font-size="16" font-family="'IBM Plex Mono', monospace" font-weight="700" letter-spacing="1.4">PARTICIPANTS</text>
    <text x="96" y="402" fill="#F7F3EC" font-size="42" font-family="system-ui, sans-serif" font-weight="800">${formatCount(telemetry.participantCount)} ${participantsLabel}</text>
    <text x="96" y="426" fill="#8FA0B6" font-size="17" font-family="system-ui, sans-serif">People currently tracked in the room.</text>
  </g>

  <g>
    <rect x="376" y="320" width="200" height="106" rx="20" fill="url(#panel)" stroke="#FFFFFF" stroke-opacity="0.08" />
    <text x="400" y="354" fill="#8FA0B6" font-size="16" font-family="'IBM Plex Mono', monospace" font-weight="700" letter-spacing="1.4">ROOM TOTAL</text>
    <text x="400" y="402" fill="#F7F3EC" font-size="42" font-family="system-ui, sans-serif" font-weight="800">${formatCompact(snapshot.totals?.tokens || 0)}</text>
    <text x="400" y="426" fill="#8FA0B6" font-size="17" font-family="system-ui, sans-serif">DRUM in the current tape.</text>
  </g>

  <g>
    <rect x="594" y="320" width="200" height="106" rx="20" fill="url(#panel)" stroke="#FFFFFF" stroke-opacity="0.08" />
    <text x="618" y="354" fill="#8FA0B6" font-size="16" font-family="'IBM Plex Mono', monospace" font-weight="700" letter-spacing="1.4">CREW BONUS</text>
    <text x="618" y="402" fill="#F7F3EC" font-size="42" font-family="system-ui, sans-serif" font-weight="800">${formatMultiplier(snapshot.metrics?.crewMultiplier || 1)}</text>
    <text x="618" y="426" fill="#8FA0B6" font-size="17" font-family="system-ui, sans-serif">${escapeHtml(titleCase(telemetry.roomMood))}</text>
  </g>

  <g>
    <rect x="812" y="320" width="316" height="106" rx="20" fill="url(#panel)" stroke="#FFFFFF" stroke-opacity="0.08" />
    <text x="836" y="354" fill="#8FA0B6" font-size="16" font-family="'IBM Plex Mono', monospace" font-weight="700" letter-spacing="1.4">TAP IN</text>
    <text x="836" y="394" fill="#F7F3EC" font-size="28" font-family="system-ui, sans-serif" font-weight="780">Visit ${meta.jamUrl.replace("https://", "")}</text>
    <text x="836" y="423" fill="#8FA0B6" font-size="17" font-family="system-ui, sans-serif">Play the room, raise the bonus, mint the drop.</text>
  </g>

  <g>
    <text x="72" y="485" fill="#FFCF72" font-size="16" font-family="'IBM Plex Mono', monospace" font-weight="700" letter-spacing="1.4">LIVE TAPE</text>
    <text x="72" y="522" fill="#C9D4E3" font-size="24" font-family="system-ui, sans-serif" font-weight="600">${escapeHtml(latestEvent)}</text>
    ${renderBars(snapshot.players || [])}
  </g>

  <g>
    <rect x="760" y="114" width="368" height="166" rx="28" fill="url(#panel)" stroke="#FFFFFF" stroke-opacity="0.08" />
    <text x="792" y="154" fill="#8FA0B6" font-size="16" font-family="'IBM Plex Mono', monospace" font-weight="700" letter-spacing="1.4">NOUN CROWD</text>
    <text x="792" y="190" fill="#F7F3EC" font-size="28" font-family="system-ui, sans-serif" font-weight="760">${formatCount(snapshot.metrics?.activeCount || 0)} active now</text>
    <text x="792" y="220" fill="#8FA0B6" font-size="18" font-family="system-ui, sans-serif">Share the room. Bring more drummers. Change the card.</text>
    ${renderParticipantDots(snapshot.metrics?.activeCount || telemetry.participantCount)}
  </g>

  <g transform="translate(1016 474)">
    <rect x="0" y="0" width="84" height="84" rx="22" fill="#182130" stroke="#FFFFFF" stroke-opacity="0.12" />
    <rect x="17" y="19" width="20" height="13" rx="5" fill="#F7F3EC" />
    <rect x="47" y="19" width="20" height="13" rx="5" fill="#F7F3EC" />
    <rect x="37" y="22" width="10" height="6" rx="3" fill="#F7F3EC" />
    <path d="M20 52C20 45.9249 24.9249 41 31 41H53C59.0751 41 64 45.9249 64 52V53C64 60.1797 58.1797 66 51 66H33C25.8203 66 20 60.1797 20 53V52Z" fill="#FF7A1A" />
    <path d="M22 49H62" stroke="#FFF7EA" stroke-width="3" stroke-linecap="round" />
    <path d="M24 36L35 48" stroke="#52E4DC" stroke-width="3.4" stroke-linecap="round" />
    <path d="M60 36L49 48" stroke="#52E4DC" stroke-width="3.4" stroke-linecap="round" />
  </g>
</svg>`;
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const roomId = sanitizeRoomId(url.searchParams.get("room"));
  const snapshot = getRoomSnapshot(roomId);
  const svg = renderSvg(snapshot, roomId);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=120, s-maxage=120, stale-while-revalidate=600",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:;",
      "X-Robots-Tag": "noindex",
    },
  });
}
