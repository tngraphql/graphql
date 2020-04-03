import 'reflect-metadata';
import { graphql } from 'graphql';
import { Container, Service } from 'typedi';

import { getMetadataStorage } from '../../src/metadata/getMetadataStorage';
import { buildSchema, ContainerType, Field, ObjectType, Query, Resolver, ResolverData, } from '../../src';
import { Router } from '../../src/router';
import { DefaultContainer } from '../../src/utils/container';

describe('IOC container', () => {
    beforeEach(() => {
        getMetadataStorage().clear();
        Container.reset();
    });

    it('should use provided container to load resolver class dependencies', async () => {
        let serviceValue: number | undefined;
        const initValue = 5;

        @Service()
        class SampleService {
            value = initValue;
        }

        @ObjectType()
        class SampleObject {
            @Field({ nullable: true })
            field?: string;
        }

        @Resolver(of => SampleObject)
        class SampleResolver {
            constructor(private service: SampleService) {
            }

            @Query()
            sampleQuery(): SampleObject {
                serviceValue = this.service.value;
                return {};
            }
        }
        const router = new Router();
        const container =  {
            store: new Map(),
            get(someClass, resolverData: ResolverData<{ requestId: number }>) {
                return Container.get(someClass);
            },
            lookup(namespace: string) {
                return this.store.get(namespace);
            },
            bind(namespace, target) {
                this.store.set(namespace, target);
            }
        };
        container.bind('SampleResolver', SampleResolver);
        router.query('sampleQuery', 'SampleResolver.sampleQuery');

        const schema = await buildSchema({
            router,
            container
            // container: Container,
            // resolvers: [SampleResolver],
        });
        const query = /* graphql */ `
      query {
        sampleQuery {
          field
        }
      }
    `;
        await graphql(schema, query);

        expect(serviceValue).toEqual(initValue);
    });

    it('should use default container to instantiate resolver class', async () => {
        let resolverValue: number | undefined;

        @ObjectType()
        class SampleObject {
            @Field({ nullable: true })
            field?: string;
        }

        @Resolver(of => SampleObject)
        class SampleResolver {
            value = Math.random();

            @Query()
            sampleQuery(): SampleObject {
                resolverValue = this.value;
                return {};
            }
        }

        const router = new Router();
        const container = new DefaultContainer();
        container.bind('SampleResolver', SampleResolver);
        router.query('sampleQuery', 'SampleResolver.sampleQuery');

        const schema = await buildSchema({
            router,
            container
        });
        const query = /* graphql */ `
      query {
        sampleQuery {
          field
        }
      }
    `;
        await graphql(schema, query);
        const firstCallValue = resolverValue;
        resolverValue = undefined;
        await graphql(schema, query);
        const secondCallValue = resolverValue;

        expect(firstCallValue).toBeDefined();
        expect(secondCallValue).toBeDefined();
        expect(firstCallValue).toEqual(secondCallValue);
    });

    it('should pass resolver\'s data to container\'s get', async () => {
        let contextRequestId!: number;
        const testContainer: ContainerType | any = {
            store: new Map(),
            get(someClass, resolverData: ResolverData<{ requestId: number }>) {
                contextRequestId = resolverData.context.requestId;
                return Container.get(someClass);
            },
            lookup(namespace: string) {
                return this.store.get(namespace);
            },
            bind(namespace, target) {
                this.store.set(namespace, target);
            }
        };

        @Resolver()
        class SampleResolver {
            @Query()
            sampleQuery(): string {
                return 'sampleQuery';
            }
        }

        const router = new Router();
        const container = testContainer;
        container.bind('SampleResolver', SampleResolver);
        router.query('sampleQuery', 'SampleResolver.sampleQuery');

        const schema = await buildSchema({
            router,
            container: testContainer,
        });

        const query = /* graphql */ `
      query {
        sampleQuery
      }
    `;

        const requestId = Math.random();
        await graphql(schema, query, null, { requestId });
        expect(contextRequestId).toEqual(requestId);
    });

    // it('should properly get container from container getter function', async () => {
    //     let called: boolean = false;
    //
    //     @Resolver()
    //     class SampleResolver {
    //         @Query()
    //         sampleQuery(): string {
    //             return 'sampleQuery';
    //         }
    //     }
    //
    //     interface TestContext {
    //         container: ContainerType;
    //     }
    //
    //     const router = new Router();
    //     router.query('sampleQuery', 'SampleResolver.sampleQuery');
    //
    //     const schema = await buildSchema({
    //         router,
    //         container: ({ context }: ResolverData<TestContext>) => context.container,
    //     });
    //
    //     const query = /* graphql */ `
    //   query {
    //     sampleQuery
    //   }
    // `;
    //
    //     const mockedContainer: ContainerType | any = {
    //         lookup(namespace: string) {
    //             return (Container as any).findService(namespace);
    //         },
    //         bind(namespace, target) {
    //             Container.set(namespace, target);
    //         },
    //         get(someClass: any) {
    //             called = true;
    //             return Container.get(someClass);
    //         },
    //     };
    //
    //     mockedContainer.bind('SampleResolver', SampleResolver);
    //
    //     const queryContext: TestContext = {
    //         container: mockedContainer,
    //     };
    //
    //     await graphql(schema, query, null, queryContext);
    //
    //     expect(called).toEqual(true);
    // });
});
