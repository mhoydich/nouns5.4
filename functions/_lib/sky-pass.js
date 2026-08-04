import {
  degreesToRadians,
  ecfToLookAngles,
  eciToEcf,
  gstime,
  propagate,
  radiansToDegrees,
  twoline2satrec,
} from "satellite.js";

export const SKY_OBSERVER = Object.freeze({
  name: "El Segundo, California",
  latitude: 33.9192,
  longitude: -118.4165,
  heightKm: 0.035,
});

export const SKY_SATELLITES = Object.freeze([
  { catalogId: "25544", label: "ISS (ZARYA)", kind: "crew + amateur radio" },
  { catalogId: "33591", label: "NOAA 19", kind: "weather satellite" },
  { catalogId: "27607", label: "SO-50", kind: "amateur radio satellite" },
]);

const CELESTRAK_BASE = "https://celestrak.org/NORAD/elements/gp.php";
const MIN_ELEVATION_DEGREES = 10;
const SEARCH_HOURS = 48;
const STEP_SECONDS = 30;

function compassPoint(azimuthDegrees) {
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round(((azimuthDegrees % 360) / 45)) % points.length];
}

export function parseTle(text, fallbackName = "Satellite") {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLineIndex = lines.findIndex((line) => line.startsWith("1 "));
  const line1 = lines[firstLineIndex];
  const line2 = lines[firstLineIndex + 1];
  if (!line1 || !line2?.startsWith("2 ")) throw new Error("CelesTrak returned an invalid TLE.");
  const name = firstLineIndex > 0 ? lines[firstLineIndex - 1] : fallbackName;
  return { name, line1, line2 };
}

function elevationAt(satrec, observerGd, date) {
  const state = propagate(satrec, date);
  if (!state?.position || typeof state.position === "boolean") return null;
  const positionEcf = eciToEcf(state.position, gstime(date));
  const angles = ecfToLookAngles(observerGd, positionEcf);
  return {
    azimuth: radiansToDegrees(angles.azimuth),
    elevation: radiansToDegrees(angles.elevation),
    rangeKm: angles.rangeSat,
  };
}

export function predictPasses({ tle, satellite, observer = SKY_OBSERVER, now = new Date(), limit = 4 }) {
  const satrec = twoline2satrec(tle.line1, tle.line2);
  const observerGd = {
    longitude: degreesToRadians(observer.longitude),
    latitude: degreesToRadians(observer.latitude),
    height: observer.heightKm,
  };
  const stopAt = now.getTime() + SEARCH_HOURS * 60 * 60 * 1000;
  const stepMs = STEP_SECONDS * 1000;
  const passes = [];
  let activePass = null;

  for (let time = now.getTime(); time <= stopAt && passes.length < limit; time += stepMs) {
    const date = new Date(time);
    const look = elevationAt(satrec, observerGd, date);
    if (!look) continue;
    const isAbove = look.elevation >= MIN_ELEVATION_DEGREES;

    if (isAbove && !activePass) {
      activePass = {
        riseAt: date,
        setAt: date,
        peakAt: date,
        maxElevation: look.elevation,
        peakAzimuth: look.azimuth,
        peakRangeKm: look.rangeKm,
      };
    } else if (isAbove && activePass) {
      activePass.setAt = date;
      if (look.elevation > activePass.maxElevation) {
        activePass.maxElevation = look.elevation;
        activePass.peakAt = date;
        activePass.peakAzimuth = look.azimuth;
        activePass.peakRangeKm = look.rangeKm;
      }
    } else if (!isAbove && activePass) {
      passes.push({
        satellite: satellite.label,
        catalogId: satellite.catalogId,
        kind: satellite.kind,
        riseAt: activePass.riseAt.toISOString(),
        peakAt: activePass.peakAt.toISOString(),
        setAt: activePass.setAt.toISOString(),
        durationSeconds: Math.max(STEP_SECONDS, Math.round((activePass.setAt - activePass.riseAt) / 1000)),
        maxElevationDegrees: Math.round(activePass.maxElevation),
        peakDirection: compassPoint(activePass.peakAzimuth),
        peakRangeKm: Math.round(activePass.peakRangeKm),
        thresholdDegrees: MIN_ELEVATION_DEGREES,
      });
      activePass = null;
    }
  }

  return passes;
}

export function celestrakUrl(catalogId) {
  const url = new URL(CELESTRAK_BASE);
  url.searchParams.set("CATNR", catalogId);
  url.searchParams.set("FORMAT", "TLE");
  return url.toString();
}

export async function buildSkyPassFeed({ fetchImpl = fetch, now = new Date() } = {}) {
  const results = await Promise.allSettled(
    SKY_SATELLITES.map(async (satellite) => {
      const sourceUrl = celestrakUrl(satellite.catalogId);
      const response = await fetchImpl(sourceUrl, {
        headers: { Accept: "text/plain" },
      });
      if (!response.ok) throw new Error(`CelesTrak ${satellite.catalogId} returned ${response.status}.`);
      const tle = parseTle(await response.text(), satellite.label);
      return {
        satellite,
        sourceUrl,
        tle,
        passes: predictPasses({ tle, satellite, now }),
      };
    }),
  );

  const successful = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
  const errors = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason instanceof Error ? result.reason.message : "Unknown orbital source error.");
  const passes = successful
    .flatMap((result) => result.passes)
    .filter((pass) => new Date(pass.setAt).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.riseAt) - new Date(b.riseAt))
    .slice(0, 8);

  if (!successful.length) throw new Error(errors[0] || "No orbital elements were available.");

  return {
    schemaVersion: "industrynext.sky-pass.v1",
    status: errors.length ? "partial" : "predicted",
    generatedAt: now.toISOString(),
    observer: SKY_OBSERVER,
    prediction: {
      model: "SGP4 from current CelesTrak GP/TLE elements",
      thresholdDegrees: MIN_ELEVATION_DEGREES,
      searchHours: SEARCH_HOURS,
      note: "A geometric pass prediction is not a confirmed radio reception or an optical visibility forecast.",
    },
    passes,
    sources: successful.map((result) => ({
      catalogId: result.satellite.catalogId,
      satellite: result.satellite.label,
      url: result.sourceUrl,
    })),
    errors,
  };
}
