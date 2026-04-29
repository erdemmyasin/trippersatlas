'use client';

import { messagesToStorageFormat, messagesFromStorage } from '@/lib/chatStore';

const WS_MAP_KEY = 'ta_trip_workspaces';

const EMPTY_BUDGET = {
  accommodation: 0,
  transport: 0,
  activities: 0,
  extras: 0,
};

function readMap() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(WS_MAP_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  localStorage.setItem(WS_MAP_KEY, JSON.stringify(map));
}

export function defaultTripWorkspace() {
  return {
    messages: [],
    plan: {
      completedModules: [],
      budget: { ...EMPTY_BUDGET },
      selectedListings: {},
    },
    mapData: { markers: [] },
    topBarData: {
      planName: 'Yeni Seyahat Planı',
      tripMeta: {
        destination: '',
        nights: 0,
        month: '',
        datesChipText: '',
        travelers: null,
        paxChipText: '',
        budget: '',
        travelType: '',
      },
    },
    coverImage: null,
  };
}

export function getTripWorkspace(tripId) {
  if (tripId == null) return defaultTripWorkspace();
  const map = readMap();
  const raw = map[String(tripId)];
  if (!raw || typeof raw !== 'object') return defaultTripWorkspace();
  const def = defaultTripWorkspace();
  const storedMsgs = Array.isArray(raw.messages) ? raw.messages : [];
  return {
    messages: messagesFromStorage(storedMsgs),
    plan: {
      completedModules: Array.isArray(raw.plan?.completedModules)
        ? raw.plan.completedModules
        : def.plan.completedModules,
      budget: { ...EMPTY_BUDGET, ...(raw.plan?.budget || {}) },
      selectedListings:
        raw.plan?.selectedListings && typeof raw.plan.selectedListings === 'object'
          ? raw.plan.selectedListings
          : {},
    },
    mapData: {
      markers: Array.isArray(raw.mapData?.markers) ? raw.mapData.markers : [],
    },
    topBarData: {
      planName: String(raw.topBarData?.planName ?? def.topBarData.planName),
      tripMeta: {
        ...def.topBarData.tripMeta,
        ...(raw.topBarData?.tripMeta && typeof raw.topBarData.tripMeta === 'object'
          ? raw.topBarData.tripMeta
          : {}),
      },
    },
    coverImage: raw.coverImage ?? null,
  };
}

/**
 * @param {string|number} tripId
 * @param {object} partial — messages: UI formatında; plan/mapData/topBarData kısmi güncelleme
 */
export function saveTripWorkspace(tripId, partial) {
  if (tripId == null || typeof window === 'undefined') return;
  const sid = String(tripId);
  const map = readMap();
  const prevEntry =
    map[sid] && typeof map[sid] === 'object' ? map[sid] : {};
  const prevStored = Array.isArray(prevEntry.messages) ? prevEntry.messages : [];

  const basePlan = {
    ...defaultTripWorkspace().plan,
    ...(prevEntry.plan && typeof prevEntry.plan === 'object' ? prevEntry.plan : {}),
  };
  const baseMap = {
    markers: [],
    ...(prevEntry.mapData && typeof prevEntry.mapData === 'object'
      ? prevEntry.mapData
      : {}),
  };
  const baseTop = {
    ...defaultTripWorkspace().topBarData,
    ...(prevEntry.topBarData && typeof prevEntry.topBarData === 'object'
      ? prevEntry.topBarData
      : {}),
    tripMeta: {
      ...defaultTripWorkspace().topBarData.tripMeta,
      ...(prevEntry.topBarData?.tripMeta &&
      typeof prevEntry.topBarData.tripMeta === 'object'
        ? prevEntry.topBarData.tripMeta
        : {}),
    },
  };

  const next = {
    messages:
      partial.messages !== undefined
        ? messagesToStorageFormat(partial.messages, prevStored)
        : prevStored,
    plan: basePlan,
    mapData: baseMap,
    topBarData: baseTop,
    coverImage:
      partial.coverImage !== undefined
        ? partial.coverImage
        : prevEntry.coverImage ?? null,
    createdAt: prevEntry.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (partial.plan && typeof partial.plan === 'object') {
    if (partial.plan.completedModules !== undefined) {
      next.plan.completedModules = partial.plan.completedModules;
    }
    if (partial.plan.budget !== undefined) {
      next.plan.budget = { ...EMPTY_BUDGET, ...partial.plan.budget };
    }
    if (partial.plan.selectedListings !== undefined) {
      next.plan.selectedListings = partial.plan.selectedListings;
    }
  }

  if (partial.mapData && typeof partial.mapData === 'object') {
    next.mapData = { ...next.mapData, ...partial.mapData };
    if (partial.mapData.markers !== undefined) {
      next.mapData.markers = partial.mapData.markers;
    }
  }

  if (partial.topBarData && typeof partial.topBarData === 'object') {
    next.topBarData = {
      ...next.topBarData,
      ...partial.topBarData,
      tripMeta: partial.topBarData.tripMeta
        ? { ...next.topBarData.tripMeta, ...partial.topBarData.tripMeta }
        : next.topBarData.tripMeta,
    };
  }

  map[sid] = next;
  writeMap(map);
}

export function deleteTripWorkspace(tripId) {
  if (tripId == null) return;
  const sid = String(tripId);
  const map = readMap();
  delete map[sid];
  writeMap(map);
}
