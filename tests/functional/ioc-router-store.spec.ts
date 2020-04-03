/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 3/16/2020
 * Time: 2:02 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import 'reflect-metadata';
import gql from 'graphql-tag';

import { execute, GraphQLSchema } from 'graphql';
import { getMetadataStorage } from '../../src/metadata/getMetadataStorage';
import { MiddlewareFn } from '../../src/interfaces';
import { Directive, Field, ObjectType, Query, Resolver } from '../../src/decorators';
import { Router } from '../../src/router';
import { DefaultContainer, IOCContainer } from '../../src/utils/container';
import { MiddlewareStore } from '../../src/middleware';
import { buildSchema } from '../../src/utils';
import { BuildContext } from '../../src/schema/build-context';
import { RouteStore } from '../../src/router/routeStore';
import { InvalidDirectiveError } from '../../src/errors';

describe('Inject router store', () => {
    beforeEach(async () => {
        getMetadataStorage().clear();
    });

    it('simple inject router store', async () => {
        @Resolver()
        class InvalidQuery {
            @Query()
            invalid(): string {
                return 'invalid';
            }
        }

        const router = new Router();
        const container = new DefaultContainer();
        container.bind('InvalidQuery', InvalidQuery);
        router.query('invalid', 'InvalidQuery.invalid');
        BuildContext.routerStoreFactory(new RouteStore(new IOCContainer(container)));
        await buildSchema({ router, container });
    });

    it('simple inject router store two', async () => {
        @Resolver()
        class InvalidQuery2 {
            @Query()
            invalid(): string {
                return 'invalid';
            }
        }

        const router = new Router();
        const container = new DefaultContainer();
        container.bind('InvalidQuery2', InvalidQuery2);
        router.query('invalid', 'InvalidQuery2.invalid');
        BuildContext.routerStoreFactory(new RouteStore(new IOCContainer(container)));
        await buildSchema({ router, container });
    });

});