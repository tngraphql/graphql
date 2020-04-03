/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 3/25/2020
 * Time: 1:28 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { Macroable } from 'macroable/build';

export class Context extends Macroable {

    /**
     * Required by macroable
     */
    protected static macros = {}
    protected static getters = {}

    constructor(context) {
        super();

        for( let key in context ) {
            this[key] = context[key];
        }
    }
}