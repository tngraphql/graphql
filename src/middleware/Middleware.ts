'use strict';

import { IOCContainer } from '../utils/container';
import { MiddlewareStoreContract } from '../interfaces';
import { Exception } from '@poppinss/utils/build';
import * as haye from 'haye';
import { MiddlewareClass } from '../interfaces/Middleware';

/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 3/13/2020
 * Time: 8:47 AM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export class Middleware {
    private list: any[] = [];

    private resolverData;

    constructor(public app: IOCContainer, public store: MiddlewareStoreContract) {
        this.register(this.store.get());
    }

    register(list: any[]) {
        if ( ! Array.isArray(list) ) {
            throw new Error('middleware.register expects an array of middleware');
        }

        this.list.push.apply(this.list, list);
        return this;
    }

    resolve(resolverData) {
        this.resolverData = resolverData;

        const uniqueMiddleware = new Map();
        for( let md of this.list ) {
            uniqueMiddleware.set(md, md);
        }

        return this.compileMiddleware(Array.from(uniqueMiddleware.values()));
    }

    resolveMiddleware(middleware, args?) {
        if ( middleware.prototype !== undefined ) {
            const middlewareClassInstance = this.app.getInstance(
                middleware as MiddlewareClass<any>,
                this.resolverData,
            );

            return {
                type: 'binding',
                value: middlewareClassInstance.handle.bind(middlewareClassInstance),
                args: args
            };
        }

        return {
            type: 'function',
            value: middleware,
            args: args
        }
    }

    compileMiddleware(middleware) {
        return middleware.map((item) => {
            if ( typeof (item) === 'function' ) {
                return this.resolveMiddleware(item);
            }

            /*const groups = this.store.getGroup(middleware);

            if ( groups ) {
                for( let item of groups) {
                    const name = this.store.getNamed(item);
                    if ( name ) {
                        res.push(this.resolveMiddleware(name))
                    }
                    this.app.getInstance(item, resolverData);
                }
            }*/

            /**
             * Extract middleware name and args from the string
             */
            const [{ name, args }] = haye.fromPipe(item).toArray();

            /**
             * Get resolved node for the given name and raise exception when that
             * name is missing
             */
            const resolvedMiddleware = this.store.getNamed(name);
            if ( ! resolvedMiddleware ) {
                throw new Exception(`Cannot find named middleware ${ name }`, 500, 'E_MISSING_NAMED_MIDDLEWARE')
            }

            if ( typeof resolvedMiddleware === 'string' ) {
                return this.resolveMiddleware(this.app.getInstance(resolvedMiddleware as any, this.resolverData), args);
            }

            return this.resolveMiddleware(resolvedMiddleware, args);
        });
    }
}
