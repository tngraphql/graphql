import { ResolverData } from './ResolverData';

export type NextFn = () => Promise<any>;

export type MiddlewareFn<TContext = {}> = (
    action: ResolverData<TContext>,
    next: NextFn,
    args?: any
) => Promise<any> | any;

export interface MiddlewareInterface<TContext = {}> {
    handle: MiddlewareFn<TContext>;
}

export interface MiddlewareClass<TContext = {}> {
    new(...args: any[]): MiddlewareInterface<TContext>;
}

export type Middleware<TContext = {}> = MiddlewareFn<TContext> | MiddlewareClass<TContext>;
