export default function patchToModelArray<T>(
  from: T[],
  to: T[],
  keyExtractor: (v: T) => any = (v: T) => (v as any).id
) {
  const idToItem = new Map();
  for (let i = 0; i < from.length; i++) {
    const item = from[i];
    idToItem.set(keyExtractor(item), item);
  }
  for (let i = 0; i < to.length; i++) {
    const item = to[i];
    if (idToItem.has(keyExtractor(item))) {
      to[i] = idToItem.get(keyExtractor(item));
      idToItem.delete(keyExtractor(item));
    }
  }
  for (let id of idToItem.keys()) {
    to.push(idToItem.get(id));
  }
}
