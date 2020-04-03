/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 3/7/2020
 * Time: 9:30 AM
 */
import { RouterType } from './index';
import { IOCContainer } from '../utils/container';
import { RouterResolver, RouterStoreFactory } from '../interfaces/RouterStoreFactory';

export class RouteStore implements RouterStoreFactory {
    public resolvers: Function[] = [];

    public queries: RouterResolver[] = [];
    public mutations: RouterResolver[] = [];
    public subscriptions: RouterResolver[] = [];
    public route: RouterType;

    constructor(public container: IOCContainer) {
    }

    boot(route) {
        this.reset();
        this.route = route;
        this.route.toJSON().forEach(route => {
            const namespace = route.handler.split('.');

            let action = 'index';

            if ( namespace.length ) {
                action = namespace.pop();
            }

            const target = this.container.lookup(namespace.join('.'));

            this.resolvers.push(target as Function);

            switch (route.method) {
            case 'query':
                this.queries.push({
                    ...route,
                    target,
                    action
                });
                break;
            case 'mutation':
                this.mutations.push({
                    ...route,
                    target,
                    action
                })
                break;
            case 'subscription':
                this.subscriptions.push({
                    ...route,
                    target,
                    action
                })
            }

        });
    }

    reset() {
        this.resolvers = [];
        this.queries = [];
        this.mutations = [];
        this.subscriptions = [];
        this.route = undefined;
    }

    getRouterResolvers(method: string): RouterResolver[] {
        switch (method) {
        case 'query':
            return this.queries;
            break;
        case 'mutation':
            return this.mutations;
            break;
        case 'subscription':
            return this.subscriptions;
        }
        return [];
    }
}