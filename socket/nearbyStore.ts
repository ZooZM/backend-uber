
export interface UserSubscription {
  socketId: string;
  userId: string;
  center: [number, number];     
  radiusM: number;  
  seenDriverIds: Set<string>;            
}

export const userSubs = new Map<string, UserSubscription>(); 

export const metersToRadians = (m: number) => m / 6378137;

export function distanceM(a: [number, number], b: [number, number]) {
  const [lon1, lat1] = a.map((v) => (v * Math.PI) / 180);
  const [lon2, lat2] = b.map((v) => (v * Math.PI) / 180);
  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;
  const s =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
  return 2 * 6378137 * Math.asin(Math.sqrt(s));
}
