/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 3/11/2020
 * Time: 5:18 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Resolver } from '../../src/decorators/Resolver';
import { Query } from '../../src/decorators/Query';
import { GraphQLSchema, IntrospectionObjectType, IntrospectionSchema } from 'graphql';
import { Arg, Field, Args, Mutation, ObjectType } from '../../src/decorators';

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

    @Resolver()
    class OverrideResolver {
        constructor(@ResolverData() name: string) {
        }
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
}

main();