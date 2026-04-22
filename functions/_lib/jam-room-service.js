const COORDINATOR_NAME = "global";
const DEFAULT_COORDINATOR_URL = "https://industrynext-jam-room-coordinator.mhoydich.workers.dev";

function getCoordinatorStub(env = {}) {
  const binding = env.JAM_ROOM_COORDINATOR;

  if (!binding) {
    return null;
  }

  if (typeof binding.idFromName === "function" && typeof binding.get === "function") {
    return binding.get(binding.idFromName(COORDINATOR_NAME));
  }

  if (typeof binding.fetch === "function") {
    return binding;
  }

  return null;
}

export function hasRoomCoordinator(env = {}) {
  return Boolean(getCoordinatorStub(env) || getCoordinatorUrl(env));
}

function getCoordinatorUrl(env = {}) {
  if (env.JAM_ROOM_COORDINATOR_URL === "disabled") {
    return null;
  }

  return env.JAM_ROOM_COORDINATOR_URL || DEFAULT_COORDINATOR_URL;
}

export async function fetchRoomCoordinator(context, path, init = {}) {
  const stub = getCoordinatorStub(context.env);
  const sourceUrl = new URL(context.request.url);

  if (stub) {
    const targetUrl = new URL(path, sourceUrl.origin);

    return await stub.fetch(targetUrl.toString(), init);
  }

  const coordinatorUrl = getCoordinatorUrl(context.env);

  if (!coordinatorUrl) {
    return null;
  }

  const targetUrl = new URL(path, coordinatorUrl);

  return await fetch(targetUrl.toString(), init);
}

export async function coordinatorJson(context, path, init = {}) {
  const response = await fetchRoomCoordinator(context, path, init);

  if (!response) {
    return null;
  }

  return await response.json();
}
