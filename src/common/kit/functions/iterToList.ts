
export default function iterToList<T>(iter: IterableIterator<T>) {
  const list: T[] = [];
  for (let v of iter) {
    list.push(v);
  }
  return list;
}