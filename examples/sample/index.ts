/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 3/11/2020
 * Time: 5:18 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { buildSchema, buildSchemaSync } from '../../src/utils';
import { Router } from '../../src/router';
import { DefaultContainer } from '../../src/utils/container';
import { Resolver } from '../../src/decorators/Resolver';
import { Query } from '../../src/decorators/Query';
import { GraphQLSchema, IntrospectionObjectType, IntrospectionSchema } from 'graphql';
import { getSchemaInfo } from '../../tests/helpers/getSchemaInfo';
import { Arg, Ctx, Field, FieldResolver, Mutation, ObjectType, PubSub, Subscription } from '../../src/decorators';
import { ClassType } from '../../src/interfaces';
import { PubSubEngine } from '../../src';
import { ApolloServer } from 'apollo-server';
import { Context } from '../../src/resolvers/context';

@Resolver()
class UserResolve {
    @Query()
    index(): string {
        return '';
    }
}

// const route = new Router();
// const container = new DefaultContainer();
// container.bind('UserResolve', UserResolve);
//
//
// route.query('user', 'UserResolve.index');
// route.query('user2', 'UserResolve.index');

async function main() {
    let schema: GraphQLSchema;
    let schemaIntrospection: IntrospectionSchema;
    let mutationType: IntrospectionObjectType;
    let subscriptionType: IntrospectionObjectType;
    let thisVar: any;
    let baseResolver: any;
    let childResolver: any;
    let overrideResolver: any;

    @ObjectType()
    class SampleObject {
        @Field()
        normalField: string;
    }

    @ObjectType()
    class DummyObject {
        @Field()
        normalField: string;
    }

    function createResolver(name: string, objectType: ClassType) {
        @Resolver(of => objectType, { isAbstract: true })
        class BaseResolver {
            protected name = 'baseName';

            @Query({ name: `${ name }Query` })
            baseQuery(@Arg('arg') arg: boolean): boolean {
                thisVar = this;
                return true;
            }

            @Mutation({ name: `${ name }Mutation` })
            baseMutation(@Arg('arg') arg: boolean): boolean {
                thisVar = this;
                return true;
            }

            @Subscription({ topics: 'baseTopic', name: `${ name }Subscription` })
            baseSubscription(@Arg('arg') arg: boolean): boolean {
                thisVar = this;
                return true;
            }

            @Mutation(returns => Boolean, { name: `${ name }Trigger` })
            async baseTrigger(@PubSub() pubSub: PubSubEngine): Promise<boolean> {
                await pubSub.publish('baseTopic', null);
                return true;
            }

            @FieldResolver()
            resolverField(): string {
                thisVar = this;
                return 'resolverField';
            }
        }

        baseResolver = BaseResolver;

        return BaseResolver;
    }

    @Resolver()
    class ChildResolver extends createResolver('prefix', SampleObject) {
        @Query()
        childQuery(@Ctx() ctx): boolean {
            console.log(ctx.nguyen);
            thisVar = this;
            return true;
        }

        @Query()
        objectQuery(): SampleObject {
            return { normalField: 'normalField' };
        }

        @Mutation()
        childMutation(): boolean {
            thisVar = this;
            return true;
        }

        @Subscription({ topics: 'childTopic', complexity: 4 })
        childSubscription(): boolean {
            thisVar = this;
            return true;
        }

        @Mutation(returns => Boolean)
        async childTrigger(@PubSub() pubSub: PubSubEngine): Promise<boolean> {
            await pubSub.publish('childTopic', null);
            return true;
        }
    }

    @Resolver()
    class OverrideResolver extends createResolver('overridden', DummyObject) {
        @Query()
        overriddenQuery(@Arg('overriddenArg') arg: boolean): string {
            thisVar = this;
            return 'overriddenQuery';
        }

        @Mutation({ name: 'overriddenMutation' })
        overriddenMutationHandler(@Arg('overriddenArg') arg: boolean): string {
            thisVar = this;
            return 'overriddenMutationHandler';
        }
    }

    const router = new Router();
    const container = new DefaultContainer();

    container.bind('ChildResolver', ChildResolver);
    container.bind('OverrideResolver', OverrideResolver);

    router.query('childQuery', 'ChildResolver.childQuery');
    router.query('objectQuery', 'ChildResolver.objectQuery');
    router.mutation('childMutation', 'ChildResolver.childMutation');
    router.subscription('childSubscription', 'ChildResolver.childSubscription');
    router.mutation('childTrigger', 'ChildResolver.childTrigger');

    router.query('prefixQuery', 'ChildResolver.baseQuery');
    router.mutation('prefixMutation', 'ChildResolver.baseMutation');
    router.subscription('prefixSubscription', 'ChildResolver.baseSubscription');
    router.mutation('prefixTrigger', 'ChildResolver.baseTrigger');

    router.query('overriddenQuery', 'OverrideResolver.overriddenQuery');
    router.mutation('overriddenMutation', 'OverrideResolver.overriddenMutationHandler');

    // router.query('overriddenQuery', 'OverrideResolver.baseQuery');
    // router.mutation('overriddenMutation', 'OverrideResolver.baseMutation');
    router.subscription('overriddenSubscription', 'OverrideResolver.baseSubscription');
    router.mutation('overriddenTrigger', 'OverrideResolver.baseTrigger');

    const schemaInfo = await buildSchema({
        router,
        container
    });

    // Create GraphQL server
    const server = new ApolloServer({
        schema: schemaInfo,
        context: context => {
            return context;
        }
    });

    Context.getter('nguyen', function() {
        return this.req._body;
    });

    // Start the server
    const { url } = await server.listen(4000);

    // console.log(queryType.fields);
}

main();