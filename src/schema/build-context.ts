import { GraphQLScalarType } from 'graphql';
import { PubSub, PubSubEngine, PubSubOptions } from 'graphql-subscriptions';

import { Middleware } from '../interfaces/Middleware';
import { ContainerGetter, ContainerType, IOCContainer } from '../utils/container';
import { Router, RouterType } from '../router';
import { RouteStore } from '../router/routeStore';
import { MiddlewareStoreContract, ResolverData } from '../interfaces';
import { MiddlewareStore } from '../middleware';
import { RouterStoreFactory } from '../interfaces/RouterStoreFactory';

export type DateScalarMode = 'isoDate' | 'timestamp';

export interface ScalarsTypeMap {
    type: Function;
    scalar: GraphQLScalarType;
}

export interface BuildContextOptions {
    dateScalarMode?: DateScalarMode;
    scalarsMap?: ScalarsTypeMap[];
    pubSub?: PubSubEngine | PubSubOptions;
    globalMiddlewares?: Array<Middleware<any>>;
    queryMiddlewares?: Array<Middleware<any>>;
    mutationMiddlewares?: Array<Middleware<any>>;
    subscriptionMiddlewares?: Array<Middleware<any>>;
    middlewareStore?: MiddlewareStoreContract;

    container?: ContainerType | ContainerGetter<any>;
    router?: RouterType;
    /**
     * Default value for type decorators, like `@Field({ nullable: true })`
     */
    nullableByDefault?: boolean;
}

export abstract class BuildContext {
    static dateScalarMode: DateScalarMode;
    static scalarsMaps: ScalarsTypeMap[];
    static pubSub: PubSubEngine;
    static globalMiddlewares: Array<Middleware<any>>;
    static queryMiddlewares: Array<Middleware<any>>;
    static mutationMiddlewares: Array<Middleware<any>>;
    static subscriptionMiddlewares: Array<Middleware<any>>;
    static middlewarePriority: Array<Middleware<any>>;
    static container: IOCContainer;
    static router: RouterStoreFactory;
    static nullableByDefault: boolean;
    static middlewareStore: MiddlewareStoreContract = new MiddlewareStore();
    static routeStore: RouterStoreFactory;

    static routerStoreFactory(fn: RouterStoreFactory) {
        this.routeStore = fn;
    }

    /**
     * Set static fields with current building context data
     */
    static create(options: BuildContextOptions) {
        if ( options.dateScalarMode !== undefined ) {
            this.dateScalarMode = options.dateScalarMode;
        }

        if ( options.scalarsMap !== undefined ) {
            this.scalarsMaps = options.scalarsMap;
        }

        if ( options.pubSub !== undefined ) {
            if ( 'eventEmitter' in options.pubSub ) {
                this.pubSub = new PubSub(options.pubSub as PubSubOptions);
            } else {
                this.pubSub = options.pubSub as PubSubEngine;
            }
        }

        if ( options.globalMiddlewares ) {
            this.globalMiddlewares = options.globalMiddlewares;
        }

        if ( options.queryMiddlewares ) {
            this.queryMiddlewares = options.queryMiddlewares;
        }
        if ( options.mutationMiddlewares ) {
            this.mutationMiddlewares = options.mutationMiddlewares;
        }
        if ( options.subscriptionMiddlewares ) {
            this.subscriptionMiddlewares = options.subscriptionMiddlewares;
        }

        if ( options.middlewareStore ) {
            this.middlewareStore = options.middlewareStore;
        }

        this.container = new IOCContainer(options.container);

        if ( ! this.routeStore ) {
            this.router = new RouteStore(this.container);
        } else {
            this.router = this.routeStore;
        }
        this.router.boot(options.router);

        if ( options.nullableByDefault !== undefined ) {
            this.nullableByDefault = options.nullableByDefault;
        }
    }

    /**
     * Restore default settings
     */
    static reset() {
        this.dateScalarMode = 'isoDate';
        this.scalarsMaps = [];
        this.pubSub = new PubSub();
        this.globalMiddlewares = [];
        // this.container = new IOCContainer();
        this.nullableByDefault = false;
        this.queryMiddlewares = [];
        this.mutationMiddlewares = [];
        this.subscriptionMiddlewares = [];
        this.router = undefined;
        this.routeStore = undefined;
    }
}

// initialize fields
BuildContext.reset();
