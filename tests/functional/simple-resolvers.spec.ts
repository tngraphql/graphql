import 'reflect-metadata';
import gql from 'graphql-tag';
import { execute, GraphQLSchema } from 'graphql';
import { buildSchema, Field, MiddlewareFn, ObjectType, Query, Resolver } from '../../src';

import { getMetadataStorage } from '../../src/metadata/getMetadataStorage';
import { Router } from '../../src/router';
import { DefaultContainer } from '../../src/utils/container';
import { MiddlewareStore } from '../../src/middleware';

describe('Simple resolvers', () => {
    let schema: GraphQLSchema;
    let middlewareLogs: string[] = [];

    beforeAll(async () => {
        getMetadataStorage().clear();

        const testMiddleware: MiddlewareFn = async ({}, next) => {
            middlewareLogs.push('middleware extecuted');
            return next();
        };

        @ObjectType()
        class NormalObject {
            @Field()
            normalField: string;
        }

        @ObjectType()
        class ObjectWithSimpleField {
            @Field({ simple: true })
            simpleField: string;
        }

        @ObjectType({ simpleResolvers: true })
        class SimpleObject {
            @Field()
            simpleField: string;
        }

        @ObjectType({ simpleResolvers: true })
        class SimpleObjectWithNormalField {
            @Field({ simple: false })
            normalField: string;
        }

        @Resolver()
        class TestResolver {
            @Query()
            normalObjectQuery(): NormalObject {
                return { normalField: 'normalField' };
            }

            @Query()
            objectWithSimpleFieldQuery(): ObjectWithSimpleField {
                return { simpleField: 'simpleField' };
            }

            @Query()
            simpleObjectQuery(): SimpleObject {
                return { simpleField: 'simpleField' };
            }

            @Query()
            simpleObjectWithNormalFieldQuery(): SimpleObjectWithNormalField {
                return { normalField: 'normalField' };
            }
        }

        const router = new Router();
        const container = new DefaultContainer();
        container.bind('TestResolver', TestResolver);
        router.query('normalObjectQuery', 'TestResolver.normalObjectQuery');
        router.query('objectWithSimpleFieldQuery', 'TestResolver.objectWithSimpleFieldQuery');
        router.query('simpleObjectQuery', 'TestResolver.simpleObjectQuery');
        router.query('simpleObjectWithNormalFieldQuery', 'TestResolver.simpleObjectWithNormalFieldQuery');

        const store = new MiddlewareStore();

        store.register([testMiddleware]);

        schema = await buildSchema({
            router,
            container,
            middlewareStore: store
        });
    });

    beforeEach(() => {
        middlewareLogs = [];
    });

    it('should execute middlewares for field resolvers for normal object', async () => {
        const document = gql`
      query {
        normalObjectQuery {
          normalField
        }
      }
    `;

        await execute({ schema, document });

        expect(middlewareLogs).toHaveLength(2);
    });

    it('shouldn\'t execute middlewares for simple field resolvers', async () => {
        const document = gql`
      query {
        objectWithSimpleFieldQuery {
          simpleField
        }
      }
    `;

        await execute({ schema, document });

        expect(middlewareLogs).toHaveLength(1);
    });

    it('shouldn\'t execute middlewares for field resolvers of simple objects', async () => {
        const document = gql`
      query {
        simpleObjectQuery {
          simpleField
        }
      }
    `;

        await execute({ schema, document });

        expect(middlewareLogs).toHaveLength(1);
    });

    it('should execute middlewares for not simple field resolvers of simple objects', async () => {
        const document = gql`
      query {
        simpleObjectWithNormalFieldQuery {
          normalField
        }
      }
    `;

        await execute({ schema, document });

        expect(middlewareLogs).toHaveLength(2);
    });
});
