export default function reduceArrayToMap<T, K = string>(
  arr: T[],
  keyExtractor: (v: T) => K  
) {
  return arr.reduce(
    (map, item) => (map.set(keyExtractor(item), item), map),
    new Map<K, T>()
  );
}
