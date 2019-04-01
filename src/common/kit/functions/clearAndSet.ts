export default function clearAndSet<T>(arr: T[], ...elems: T[]) {
  arr.splice(0, arr.length, ...elems);
}
