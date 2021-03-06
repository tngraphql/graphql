/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 3/16/2020
 * Time: 1:35 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export interface RouterResolver {
    method: string;
    handleName: string;
    handler: string;
    middleware: any[];
    action: string;
    target: Function;
}

export interface RouterStoreFactory {
    resolvers: Function[];

    boot(route);

    getRouterResolvers(method: string): RouterResolver[];
}