type Worksite = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  allowed_radius_meters: number;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

export type AttendanceMode = "check_in" | "check_out";

export function haversineDistanceMeters(
  from: Coordinates,
  to: Coordinates,
): number {
  const earthRadiusMeters = 6371000;
  const dLat = degreesToRadians(to.latitude - from.latitude);
  const dLon = degreesToRadians(to.longitude - from.longitude);

  const lat1 = degreesToRadians(from.latitude);
  const lat2 = degreesToRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusMeters * c);
}

export function isWithinWorksiteRadius(
  coordinates: Coordinates,
  worksite: Worksite,
) {
  const distanceMeters = haversineDistanceMeters(coordinates, {
    latitude: worksite.latitude,
    longitude: worksite.longitude,
  });

  return {
    distanceMeters,
    isWithinRadius: distanceMeters <= worksite.allowed_radius_meters,
  };
}

export function detectAttendanceMode(record: {
  check_in_at: string | null;
  check_out_at: string | null;
} | null): AttendanceMode {
  if (!record || !record.check_in_at) {
    return "check_in";
  }

  if (!record.check_out_at) {
    return "check_out";
  }

  return "check_in";
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}
