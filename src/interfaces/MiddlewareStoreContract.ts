/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 3/12/2020
 * Time: 9:42 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export interface MiddlewareStoreContract {
    register(middleware: any): void;

    registerNamed(middleware: any): void;

    get (): any[]
    getNamed (name: string): null | any
    getGroup (name: string): null | any
    invokeMiddleware (
        middleware: any,
        params: [any, () => Promise<void>],
    ): Promise<void>
}