import 'reflect-metadata';
import { graphql, GraphQLSchema } from 'graphql';

import { getMetadataStorage } from '../../src/metadata/getMetadataStorage';
import {
    Arg,
    buildSchema,
    Field,
    FieldResolver,
    MiddlewareFn,
    MiddlewareInterface,
    NextFn,
    ObjectType,
    Query,
    Resolver,
    ResolverData,
    UseMiddleware,
} from '../../src';
import { createMethodDecorator } from '../../src/decorators/createMethodDecorator';
import { Router } from '../../src/router';
import { DefaultContainer, IOCContainer } from '../../src/utils/container';
import { Container } from 'typedi';
import { applyMiddlewares } from '../../src/resolvers/helpers';
import { Middleware } from '../../src/middleware/Middleware';
import { MiddlewareStore } from '../../src/middleware';

describe('Middlewares', () => {
    let schema: GraphQLSchema;
    let sampleResolver: any;
    let middlewareLogs: string[] = [];
    const router = new Router();
    const container = new DefaultContainer();
    const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

    beforeEach(() => {
        middlewareLogs = [];
    });

    beforeAll(async () => {
        getMetadataStorage().clear();

        const middleware1: MiddlewareFn = async ({}, next) => {
            middlewareLogs.push('middleware1 before');
            const result = await next();
            middlewareLogs.push('middleware1 after');
            return result;
        };
        const middleware2: MiddlewareFn = async ({}, next) => {
            middlewareLogs.push('middleware2 before');
            const result = await next();
            middlewareLogs.push('middleware2 after');
            return result;
        };
        const middleware3: MiddlewareFn = async ({}, next) => {
            middlewareLogs.push('middleware3 before');
            const result = await next();
            middlewareLogs.push('middleware3 after');
            return result;
        };
        const interceptMiddleware: MiddlewareFn = async ({}, next) => {
            const result = await next();
            middlewareLogs.push(result);
            return 'interceptMiddleware';
        };
        const returnUndefinedMiddleware: MiddlewareFn = async ({}, next) => {
            const result = await next();
            middlewareLogs.push(result);
        };
        const errorCatchMiddleware: MiddlewareFn = async ({}, next) => {
            try {
                return await next();
            } catch (err) {
                middlewareLogs.push(err.message);
                return 'errorCatchMiddleware';
            }
        };
        const errorThrowAfterMiddleware: MiddlewareFn = async ({}, next) => {
            await next();
            middlewareLogs.push('errorThrowAfterMiddleware');
            throw new Error('errorThrowAfterMiddleware');
        };
        const errorThrowMiddleware: MiddlewareFn = async ({}, next) => {
            middlewareLogs.push('errorThrowMiddleware');
            throw new Error('errorThrowMiddleware');
        };
        const fieldResolverMiddleware: MiddlewareFn = async ({}, next) => {
            middlewareLogs.push('fieldResolverMiddlewareBefore');
            const result = await next();
            middlewareLogs.push('fieldResolverMiddlewareAfter');
            return result;
        };
        const doubleNextMiddleware: MiddlewareFn = async ({}, next) => {
            const result1 = await next();
            const result2 = await next();
            return result1;
        };

        class ClassMiddleware implements MiddlewareInterface {
            private logName = 'ClassMiddleware';

            async handle(action: ResolverData, next: NextFn) {
                middlewareLogs.push(`${ this.logName } before`);
                const result = await next();
                middlewareLogs.push(`${ this.logName } after`);
                return result;
            }
        }

        const CustomMethodDecorator = createMethodDecorator(async (resolverData, next) => {
            middlewareLogs.push('CustomMethodDecorator');
            return next();
        });

        @ObjectType()
        class SampleObject {
            @Field()
            normalField: string;

            @Field()
            resolverField: string;

            @Field()
            @UseMiddleware(fieldResolverMiddleware)
            middlewareField: string;
        }

        @Resolver(of => SampleObject)
        class SampleResolver {
            @Query()
            normalQuery(): boolean {
                return true;
            }

            @Query()
            sampleObjectQuery(): SampleObject {
                return {
                    normalField: 'normalField',
                    middlewareField: 'middlewareField',
                } as SampleObject;
            }

            @Query(returns => String)
            @UseMiddleware(middleware1, middleware2, middleware3)
            async middlewareOrderQuery() {
                middlewareLogs.push('middlewareOrderQuery');
                await sleep(25);
                return 'middlewareOrderQueryResult';
            }

            @UseMiddleware(middleware1)
            @UseMiddleware(middleware2)
            @UseMiddleware(middleware3)
            @Query(returns => String)
            async multipleMiddlewareDecoratorsQuery() {
                middlewareLogs.push('multipleMiddlewareDecoratorsQuery');
                return 'multipleMiddlewareDecoratorsQueryResult';
            }

            @Query()
            @UseMiddleware(interceptMiddleware)
            middlewareInterceptQuery(): string {
                middlewareLogs.push('middlewareInterceptQuery');
                return 'middlewareInterceptQueryResult';
            }

            @Query()
            @UseMiddleware(
                returnUndefinedMiddleware,
                returnUndefinedMiddleware,
                returnUndefinedMiddleware,
            )
            middlewareReturnUndefinedQuery(): string {
                middlewareLogs.push('middlewareReturnUndefinedQuery');
                return 'middlewareReturnUndefinedQueryResult';
            }

            @Query()
            @UseMiddleware(errorCatchMiddleware)
            middlewareErrorCatchQuery(@Arg('throwError') throwError: boolean): string {
                middlewareLogs.push('middlewareErrorCatchQuery');
                if ( throwError ) {
                    throw new Error('middlewareErrorCatchQueryError');
                }
                return 'middlewareErrorCatchQueryResult';
            }

            @Query()
            @UseMiddleware(errorThrowAfterMiddleware)
            middlewareThrowErrorAfterQuery(): string {
                middlewareLogs.push('middlewareThrowErrorAfterQuery');
                return 'middlewareThrowErrorAfterQueryResult';
            }

            @Query()
            @UseMiddleware(errorThrowMiddleware)
            middlewareThrowErrorQuery(): string {
                middlewareLogs.push('middlewareThrowErrorQuery');
                return 'middlewareThrowErrorQueryResult';
            }

            @Query()
            @UseMiddleware(doubleNextMiddleware)
            doubleNextMiddlewareQuery(): string {
                middlewareLogs.push('doubleNextMiddlewareQuery');
                return 'doubleNextMiddlewareQueryResult';
            }

            @Query()
            @UseMiddleware(ClassMiddleware)
            classMiddlewareQuery(): string {
                middlewareLogs.push('classMiddlewareQuery');
                return 'classMiddlewareQueryResult';
            }

            @Query()
            @CustomMethodDecorator
            customMethodDecoratorQuery(): string {
                middlewareLogs.push('customMethodDecoratorQuery');
                return 'customMethodDecoratorQuery';
            }

            @FieldResolver()
            @UseMiddleware(fieldResolverMiddleware)
            resolverField(): string {
                middlewareLogs.push('resolverField');
                return 'resolverField';
            }
        }

        sampleResolver = SampleResolver;

        container.bind('SampleResolver', SampleResolver);
        router.query('normalQuery', 'SampleResolver.normalQuery');
        router.query('sampleObjectQuery', 'SampleResolver.sampleObjectQuery');
        router.query('middlewareOrderQuery', 'SampleResolver.middlewareOrderQuery');
        router.query('multipleMiddlewareDecoratorsQuery', 'SampleResolver.multipleMiddlewareDecoratorsQuery');
        router.query('middlewareInterceptQuery', 'SampleResolver.middlewareInterceptQuery');
        router.query('middlewareReturnUndefinedQuery', 'SampleResolver.middlewareReturnUndefinedQuery');
        router.query('middlewareErrorCatchQuery', 'SampleResolver.middlewareErrorCatchQuery');
        router.query('middlewareThrowErrorAfterQuery', 'SampleResolver.middlewareThrowErrorAfterQuery');
        router.query('middlewareThrowErrorQuery', 'SampleResolver.middlewareThrowErrorQuery');
        router.query('doubleNextMiddlewareQuery', 'SampleResolver.doubleNextMiddlewareQuery');
        router.query('classMiddlewareQuery', 'SampleResolver.classMiddlewareQuery');
        router.query('customMethodDecoratorQuery', 'SampleResolver.customMethodDecoratorQuery');


        schema = await buildSchema({
            router,
            container
        });
    });

    describe('Middleware | GraphQL', () => {
        it('should build the schema without errors', async () => {
            expect(schema).toBeDefined();
        });

        it('should correctly returns value from normal query', async () => {
            const query = `query {
      normalQuery
    }`;

            const { data } = await graphql(schema, query);

            expect(data!.normalQuery).toEqual(true);
        });

        it('should correctly call middlewares in order', async () => {
            const query = `query {
      middlewareOrderQuery
    }`;

            const { data } = await graphql(schema, query);

            expect(data!.middlewareOrderQuery).toEqual('middlewareOrderQueryResult');

            expect(middlewareLogs).toHaveLength(7);
            expect(middlewareLogs[0]).toEqual('middleware1 before');
            expect(middlewareLogs[1]).toEqual('middleware2 before');
            expect(middlewareLogs[2]).toEqual('middleware3 before');
            expect(middlewareLogs[3]).toEqual('middlewareOrderQuery');
            expect(middlewareLogs[4]).toEqual('middleware3 after');
            expect(middlewareLogs[5]).toEqual('middleware2 after');
            expect(middlewareLogs[6]).toEqual('middleware1 after');
        });
        it('should call middlewares in router', async () => {
            const query = `query {
      middlewareOrderQuery
    }`;
            const middleware4: MiddlewareFn = async ({}, next) => {
                middlewareLogs.push('middleware4');
                const result = await next();
                return result;
            };

            router.query('middlewareOrderQuery', 'SampleResolver.middlewareOrderQuery')
                .middleware([middleware4])

            const schema = await buildSchema({
                router,
                container
            });
            const { data } = await graphql(schema, query);

            expect(middlewareLogs).toHaveLength(8);
            expect(middlewareLogs[0]).toEqual('middleware1 before');
            expect(middlewareLogs[1]).toEqual('middleware2 before');
            expect(middlewareLogs[2]).toEqual('middleware3 before');
            expect(middlewareLogs[3]).toBe('middleware4');
        });

        it('should call middlewares in order of multiple decorators', async () => {
            const query = `query {
      multipleMiddlewareDecoratorsQuery
    }`;

            const { data } = await graphql(schema, query);

            expect(data!.multipleMiddlewareDecoratorsQuery).toEqual(
                'multipleMiddlewareDecoratorsQueryResult',
            );

            expect(middlewareLogs).toHaveLength(7);
            expect(middlewareLogs[0]).toEqual('middleware1 before');
            expect(middlewareLogs[1]).toEqual('middleware2 before');
            expect(middlewareLogs[2]).toEqual('middleware3 before');
            expect(middlewareLogs[3]).toEqual('multipleMiddlewareDecoratorsQuery');
            expect(middlewareLogs[4]).toEqual('middleware3 after');
            expect(middlewareLogs[5]).toEqual('middleware2 after');
            expect(middlewareLogs[6]).toEqual('middleware1 after');
        });

        it('should correctly intercept returned value', async () => {
            const query = `query {
      middlewareInterceptQuery
    }`;

            const { data } = await graphql(schema, query);

            expect(data!.middlewareInterceptQuery).toEqual('interceptMiddleware');
            expect(middlewareLogs).toHaveLength(2);
            expect(middlewareLogs[0]).toEqual('middlewareInterceptQuery');
            expect(middlewareLogs[1]).toEqual('middlewareInterceptQueryResult');
        });

        it('should correctly use next middleware value when undefined returned', async () => {
            const query = `query {
      middlewareReturnUndefinedQuery
    }`;

            const { data } = await graphql(schema, query);

            expect(data!.middlewareReturnUndefinedQuery).toEqual('middlewareReturnUndefinedQueryResult');
            expect(middlewareLogs).toHaveLength(2);
            expect(middlewareLogs[0]).toEqual('middlewareReturnUndefinedQuery');
            expect(middlewareLogs[1]).toEqual('middlewareReturnUndefinedQueryResult');
            // expect(middlewareLogs[2]).toEqual('middlewareReturnUndefinedQueryResult');
            // expect(middlewareLogs[3]).toEqual('middlewareReturnUndefinedQueryResult');
        });

        it('should correctly catch error thrown in resolver', async () => {
            const query = `query {
      middlewareErrorCatchQuery(throwError: true)
    }`;

            const { data } = await graphql(schema, query);

            expect(data!.middlewareErrorCatchQuery).toEqual('errorCatchMiddleware');
            expect(middlewareLogs).toHaveLength(2);
            expect(middlewareLogs[0]).toEqual('middlewareErrorCatchQuery');
            expect(middlewareLogs[1]).toEqual('middlewareErrorCatchQueryError');
        });

        it('should not modify the response if error not thrown', async () => {
            const query = `query {
      middlewareErrorCatchQuery(throwError: false)
    }`;

            const { data } = await graphql(schema, query);

            expect(data!.middlewareErrorCatchQuery).toEqual('middlewareErrorCatchQueryResult');
        });

        it('should propagate thrown error up to graphql handler', async () => {
            const query = `query {
      middlewareThrowErrorAfterQuery
    }`;

            const { errors } = await graphql(schema, query);

            expect(errors).toHaveLength(1);
            expect(errors![0].message).toEqual('errorThrowAfterMiddleware');
            expect(middlewareLogs).toHaveLength(2);
            expect(middlewareLogs[0]).toEqual('middlewareThrowErrorAfterQuery');
            expect(middlewareLogs[1]).toEqual('errorThrowAfterMiddleware');
        });

        it('should prevent calling handler when `next` not invoked', async () => {
            const query = `query {
      middlewareThrowErrorQuery
    }`;

            const { errors } = await graphql(schema, query);

            expect(errors).toHaveLength(1);
            expect(errors![0].message).toEqual('errorThrowMiddleware');
            expect(middlewareLogs).toHaveLength(1);
            expect(middlewareLogs[0]).toEqual('errorThrowMiddleware');
        });

        it('should call middlewares for field resolver', async () => {
            const query = `query {
      sampleObjectQuery {
        resolverField
      }
    }`;

            const { data } = await graphql(schema, query);

            expect(data!.sampleObjectQuery.resolverField).toEqual('resolverField');
            expect(middlewareLogs).toHaveLength(3);
            expect(middlewareLogs[0]).toEqual('fieldResolverMiddlewareBefore');
            expect(middlewareLogs[1]).toEqual('resolverField');
            expect(middlewareLogs[2]).toEqual('fieldResolverMiddlewareAfter');
        });

        it('should correctly call class middleware', async () => {
            const query = `query {
      classMiddlewareQuery
    }`;

            const { data } = await graphql(schema, query);

            expect(data!.classMiddlewareQuery).toEqual('classMiddlewareQueryResult');
            expect(middlewareLogs).toHaveLength(3);
            expect(middlewareLogs[0]).toEqual('ClassMiddleware before');
            expect(middlewareLogs[1]).toEqual('classMiddlewareQuery');
            expect(middlewareLogs[2]).toEqual('ClassMiddleware after');
        });

        it('should correctly call resolver of custom method decorator', async () => {
            const query = `query {
      customMethodDecoratorQuery
    }`;

            const { data } = await graphql(schema, query);

            expect(data!.customMethodDecoratorQuery).toEqual('customMethodDecoratorQuery');
            expect(middlewareLogs).toHaveLength(2);
            expect(middlewareLogs[0]).toEqual('CustomMethodDecorator');
            expect(middlewareLogs[1]).toEqual('customMethodDecoratorQuery');
        });

        it('should call middlewares for normal field', async () => {
            const query = `query {
      sampleObjectQuery {
        middlewareField
      }
    }`;

            const { data } = await graphql(schema, query);

            expect(data!.sampleObjectQuery.middlewareField).toEqual('middlewareField');
            expect(middlewareLogs).toHaveLength(2);
            expect(middlewareLogs[0]).toEqual('fieldResolverMiddlewareBefore');
            expect(middlewareLogs[1]).toEqual('fieldResolverMiddlewareAfter');
        });

        it('should throw error if middleware called next more than once', async () => {
            const query = `query {
      doubleNextMiddlewareQuery
    }`;

            const { errors } = await graphql(schema, query);

            expect(errors).toHaveLength(1);
            expect(errors![0].message).toEqual('next() called multiple times');
        });

        it('should correctly call global middlewares before local ones', async () => {
            const globalMiddleware1: MiddlewareFn = async ({}, next) => {
                middlewareLogs.push('globalMiddleware1 before');
                const result = await next();
                middlewareLogs.push('globalMiddleware1 after');
                return result;
            };
            const globalMiddleware2: MiddlewareFn = async ({}, next) => {
                middlewareLogs.push('globalMiddleware2 before');
                const result = await next();
                middlewareLogs.push('globalMiddleware2 after');
                return result;
            };
            const router = new Router();
            const container = new DefaultContainer();

            container.bind('SampleResolver', sampleResolver);
            router.query('normalQuery', 'SampleResolver.normalQuery');
            router.query('sampleObjectQuery', 'SampleResolver.sampleObjectQuery');
            router.query('middlewareOrderQuery', 'SampleResolver.middlewareOrderQuery');
            router.query('multipleMiddlewareDecoratorsQuery', 'SampleResolver.multipleMiddlewareDecoratorsQuery');
            router.query('middlewareInterceptQuery', 'SampleResolver.middlewareInterceptQuery');
            router.query('middlewareReturnUndefinedQuery', 'SampleResolver.middlewareReturnUndefinedQuery');
            router.query('middlewareErrorCatchQuery', 'SampleResolver.middlewareErrorCatchQuery');
            router.query('middlewareThrowErrorAfterQuery', 'SampleResolver.middlewareThrowErrorAfterQuery');
            router.query('middlewareThrowErrorQuery', 'SampleResolver.middlewareThrowErrorQuery');
            router.query('doubleNextMiddlewareQuery', 'SampleResolver.doubleNextMiddlewareQuery');
            router.query('classMiddlewareQuery', 'SampleResolver.classMiddlewareQuery');
            router.query('customMethodDecoratorQuery', 'SampleResolver.customMethodDecoratorQuery');

            const store = new MiddlewareStore();

            store.register([globalMiddleware1, globalMiddleware2]);

            const localSchema = await buildSchema({
                router,
                container,
                middlewareStore: store
                // globalMiddlewares: [globalMiddleware1, globalMiddleware2],
            });
            const query = `query {
      middlewareOrderQuery
    }`;

            const { data } = await graphql(localSchema, query);

            expect(data!.middlewareOrderQuery).toEqual('middlewareOrderQueryResult');
            expect(middlewareLogs).toHaveLength(11);
            expect(middlewareLogs[0]).toEqual('globalMiddleware1 before');
            expect(middlewareLogs[1]).toEqual('globalMiddleware2 before');
            expect(middlewareLogs[2]).toEqual('middleware1 before');
            expect(middlewareLogs[3]).toEqual('middleware2 before');
            expect(middlewareLogs[4]).toEqual('middleware3 before');
            expect(middlewareLogs[5]).toEqual('middlewareOrderQuery');
            expect(middlewareLogs[6]).toEqual('middleware3 after');
            expect(middlewareLogs[7]).toEqual('middleware2 after');
            expect(middlewareLogs[8]).toEqual('middleware1 after');
            expect(middlewareLogs[9]).toEqual('globalMiddleware2 after');
            expect(middlewareLogs[10]).toEqual('globalMiddleware1 after');
        });
    });

    describe('Middleware | Runnable', () => {
        let router;
        let container;

        beforeEach(async () => {
            router = new Router();
            container = {
                store: new Map(),
                get(someClass, resolverData: ResolverData<{ requestId: number }>) {
                    if ( typeof someClass === 'string' ) {
                        return Container.get(Container.get(someClass));
                    }
                    return Container.get(someClass);
                },
                lookup(namespace: string) {
                    return this.store.get(namespace);
                },
                bind(namespace, target) {
                    Container.set(namespace, target);
                    this.store.set(namespace, target);
                }
            };
        })
        it('compose a middleware chain that can be executed in sequence', async () => {
            const chain: string[] = []

            async function first(data, next) {
                chain.push('first')
                await next()
            }

            async function second(data, next) {
                chain.push('second')
                await next()
            }

            async function third(data, next, args) {
                chain.push('third')
                await next()
            }

            const ioc = new IOCContainer(container);

            const store = new MiddlewareStore();

            store.register([
                first,
                second,
                third
            ]);

            const middleware = new Middleware(ioc, store);

            await applyMiddlewares(ioc, {} as any, middleware.resolve([]), () => {
                return
            });

            expect(chain).toEqual(['first', 'second', 'third']);
        });

        it('execute in sequence even when some methods are async', async () => {
            const chain: string[] = []

            async function first(data, next) {
                chain.push('first')
                await next()
            }

            async function second(data, next) {
                await sleep(100)
                chain.push('second')
                await next()
            }

            async function third(data, next) {
                chain.push('third')
                await next()
            }

            const ioc = new IOCContainer(container);

            const store = new MiddlewareStore();

            store.register([
                first,
                second,
                third
            ]);

            const middleware = new Middleware(ioc, store);

            await applyMiddlewares(ioc, {} as any, middleware.resolve([]), () => {
                return
            });

            expect(chain).toEqual(['first', 'second', 'third']);
        });

        it('stop middleware chain when a method throws exception', async () => {
            expect.assertions(2);

            const chain: string[] = []

            async function first(data, next) {
                chain.push('first')
                await next()
            }

            async function second(data, next) {
                throw new Error('I am killed')
            }

            async function third(data, next) {
                chain.push('third')
                await next()
            }

            try {
                const ioc = new IOCContainer(container);

                const store = new MiddlewareStore();

                store.register([
                    first,
                    second,
                    third
                ]);

                const middleware = new Middleware(ioc, store);

                await applyMiddlewares(ioc, {} as any, middleware.resolve([]), () => {
                    return
                });
            } catch (e) {
                expect(e.message).toBe('I am killed');
                expect(chain).toEqual(['first'])
            }
        });

        it('pass params to all the middleware functions', async () => {
            async function first(request, next) {
                request.first = true
                await next()
            }

            async function second(request, next) {
                request.second = true
                await next()
            }

            async function third(request, next) {
                request.third = true
                await next()
            }

            const context: any = {};

            const ioc = new IOCContainer(container);

            const store = new MiddlewareStore();

            store.register([
                first,
                second,
                third
            ]);

            const middleware = new Middleware(ioc, store);

            await applyMiddlewares(ioc, context, middleware.resolve([]), () => {
                return
            });

            expect(context).toEqual({ first: true, second: true, third: true });
        });

        it('should be able to pass params and bind context to all the middleware functions', async () => {
            class First {
                public async handle(request, next) {
                    request.first = this.constructor.name
                    await next()
                }
            }

            class Second {
                public async handle(request, next) {
                    request.second = this.constructor.name
                    await next()
                }
            }

            class Third {
                public async handle(request, next) {
                    request.third = this.constructor.name
                    await next()
                }
            }

            const context: any = {};

            const ioc = new IOCContainer(container);

            const store = new MiddlewareStore();

            store.register([
                First,
                Second,
                Third
            ]);

            const middleware = new Middleware(ioc, store);

            await applyMiddlewares(ioc, context, [
                First,
                Second,
                Third
            ], () => {
                return
            });

            expect(context).toEqual({ first: 'First', second: 'Second', third: 'Third' });
        });

        it('throws error when a middleware multiple calls to next', async () => {
            expect.assertions(2);

            const chain: string[] = []

            async function first(data, next) {
                chain.push('first')
                await next()
            }

            async function second(data, next) {
                chain.push('second')
                await next()
                await next()
            }

            async function third(data, next) {
                chain.push('third')
                await next()
            }

            try {
                const ioc = new IOCContainer(container);

                const store = new MiddlewareStore();

                store.register([
                    first,
                    second,
                    third
                ]);

                const middleware = new Middleware(ioc, store);

                await applyMiddlewares(ioc, {} as any, middleware.resolve([]), () => {
                    return
                });

            } catch (e) {
                expect(e.message).toBe('next() called multiple times');
                expect(chain).toEqual(['first', 'second', 'third',]);
            }
        });

        it('params should not collide with each other', async () => {
            async function first(request, next) {
                request.count++
                await next()
            }

            async function second(request, next) {
                request.count++
                await sleep(500)
                await next()
            }

            async function third(request, next) {
                request.count++
                await next()
            }

            const context: any = { count: 0 };
            const otherContext: any = { count: 0 };

            const ioc = new IOCContainer(container);

            const store = new MiddlewareStore();

            store.register([
                first,
                second,
                third
            ]);

            const middleware = new Middleware(ioc, store);

            await applyMiddlewares(ioc, context, middleware.resolve([]), () => {
                return
            });
            await applyMiddlewares(ioc, otherContext, middleware.resolve([]), () => {
                return
            });

            expect(context.count).toBe(3);
            expect(otherContext.count).toBe(3);
        });

        it('run fine when methods are not async and neither returns promise', async () => {
            const chain: string[] = []

            async function first(data, next) {
                chain.push('first');
            }

            const ioc = new IOCContainer(container);

            const store = new MiddlewareStore();

            store.register([
                first
            ]);

            const middleware = new Middleware(ioc, store);

            await applyMiddlewares(ioc, {} as any, middleware.resolve([]), () => {
                return
            });

            expect(chain).toEqual(['first']);
        });

        it('should correctly call middlewares in order', async () => {
            const chain: string[] = []

            async function first(data, next) {
                chain.push('first')
                await next()
                chain.push('first after')
            }

            async function second(data, next) {
                chain.push('second')
                await sleep(200)
                await next()
                chain.push('second after')
            }

            async function third(data, next) {
                chain.push('third')
                await next()
                chain.push('third after')
            }

            const ioc = new IOCContainer(container);

            const store = new MiddlewareStore();

            store.register([
                first,
                second,
                third
            ]);

            const middleware = new Middleware(ioc, store);

            await applyMiddlewares(ioc, {} as any, middleware.resolve([]), () => {
                return
            });

            expect(chain).toEqual([
                'first',
                'second',
                'third',
                'third after',
                'second after',
                'first after'
            ]);
        });

        it('should be able to pass args to the middleware functions', async () => {
            let chain = [];

            class Auth implements MiddlewareInterface {
                async handle(resource, next, args) {
                    chain = args;
                    next();
                }
            }

            const ioc = new IOCContainer(container);

            const store = new MiddlewareStore();

            store.registerNamed({
                'auth': Auth
            });

            const middleware = new Middleware(ioc, store).register(['auth:admin']);

            await applyMiddlewares(ioc, {} as any, middleware.resolve([]), () => {
                return
            });

            expect(chain).toEqual(['admin']);
        });
    });
});
