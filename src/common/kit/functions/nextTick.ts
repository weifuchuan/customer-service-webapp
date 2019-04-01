import { animationFrame } from 'rxjs/internal/scheduler/animationFrame';

export default function nextTick(f: () => any, delay?: number) {
  animationFrame.schedule(f, delay);
}
