const COORDINATOR_NAME = "global";

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
  return Boolean(getCoordinatorStub(env));
}

export async function fetchRoomCoordinator(context, path, init = {}) {
  const stub = getCoordinatorStub(context.env);

  if (!stub) {
    return null;
  }

  const sourceUrl = new URL(context.request.url);
  const targetUrl = new URL(path, sourceUrl.origin);

  return stub.fetch(targetUrl.toString(), init);
}

export async function coordinatorJson(context, path, init = {}) {
  const response = await fetchRoomCoordinator(context, path, init);

  if (!response) {
    return null;
  }

  return response.json();
}
