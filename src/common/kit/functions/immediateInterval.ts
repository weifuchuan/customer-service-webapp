import { SchedulerLike, Observable, interval, Subscriber } from "rxjs";

export default function immediateInterval(
  period?: number | undefined,
  scheduler?: SchedulerLike | undefined
): Observable<number> {
  return new Observable(subscriber => {
    subscriber.next(0);
    const interval$ = interval(period, scheduler);
    const next = subscriber.next; 
    subscriber.next = function(this: Subscriber<number>, i: number) {
      next.bind(this)(i + 1);
    }.bind(subscriber);
    interval$.subscribe(subscriber);
  });
}
