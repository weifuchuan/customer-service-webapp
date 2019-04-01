import { ComponentType } from 'react';

export type GetProps<C> = C extends ComponentType<infer P> ? P : never;