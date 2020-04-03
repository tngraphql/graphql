/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 3/12/2020
 * Time: 9:42 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { MiddlewareStoreContract } from '../interfaces/MiddlewareStoreContract';

export class MiddlewareStore implements MiddlewareStoreContract {
    /**
     * A list of global middleware
     */
    private list: any[] = [];

    private group: any[] = [];

    private query: any[] = [];
    private muation: any[] = [];
    private sub: any[] = [];
    private middlewarePriority = [];

    /**
     * A map of named middleware. Named middleware are used as reference
     * on the routes
     */
    private named: { [alias: string]: any } = {}

    constructor() {
    }

    public register(middleware: any) {
        this.list = middleware;
        return this;
    }

    public registerGroup(middleware: any) {
        this.group = middleware;
    }

    public registerQuery(middleware: any) {
        this.query = middleware;
    }

    public registerMutation(middleware: any) {
        this.muation = middleware;
    }

    public registerSub(middleware: any) {

    }

    public priority(middleware: any) {
        this.middlewarePriority = middleware;
    }

    public registerNamed(middleware: { [alias: string]: any }) {
        this.named = middleware;
        return this;
    }

    get(): any[] {
        return this.list;
    }

    getPriority() {
        return this.middlewarePriority;
    }

    // getQuery() {
    //     return this.query;
    // }
    //
    // getMutation() {
    //     return this.muation;
    // }

    getNamed(name: string): any | null {
        return this.named[name];
    }

    getGroup(name: string) {
        return this.group[name];
    }

    invokeMiddleware(handlerFn: any, params: [any, (() => Promise<void>)]): Promise<void> {
        return handlerFn(params[0], params[1], []);
    }
}