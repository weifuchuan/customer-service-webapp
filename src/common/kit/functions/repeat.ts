// repeat run f by timeout if f return false
export default function repeat(f: () => boolean, timeout: number = 1000 / 60) {
  const g: any = (g: any) => {
    if (f()) {
      return;
    }
    setTimeout(() => {
      g(g);
    }, timeout);
  };
  g(g);
}