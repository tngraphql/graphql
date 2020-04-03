/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 3/6/2020
 * Time: 8:53 AM
 */
import { Route } from './route';

export interface RouterType {
    toJSON()
}

export class Router {
    public routes: any[] = [];

    // public Route: Route;

    private openedGroups: any[] = [];

    private getRecentGroup () {
        return this.openedGroups[this.openedGroups.length - 1]
    }

    constructor () {
    }

    /**
     * Add query for a given pattern and methods
     */
    public route (handleName: string, method: string, handler: any): Route {
        const route = new Route(handleName, method, handler);

        this.routes.push(route);

        return route
    }

    /**
     * Define `Query` route
     */
    public query (queryName: string, handler: any): Route {
        return this.route(queryName, 'query', handler)
    }

    /**
     * Define `Mutation` route
     */
    public mutation (queryName: string, handler: any): Route {
        return this.route(queryName, 'mutation', handler)
    }

    /**
     * Define `Subscription` route
     */
    public subscription (queryName: string, handler: any): Route {
        return this.route(queryName, 'subscription', handler)
    }

    /**
     * Returns a flat list of routes JSON
     */
    public toJSON () {
        return toRoutesJSON(this.routes);
    }
}

function toRoutesJSON (
    routes: Route[],
): any[] {
    return routes.reduce((list: any[], route) => {
        if (!route.deleted) {
            list.push(route.toJSON())
        }

        return list
    }, [])
}
