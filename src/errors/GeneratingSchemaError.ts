import { GraphQLError } from 'graphql';

export class GeneratingSchemaError extends Error {
    constructor(public details: ReadonlyArray<GraphQLError>) {
        super('Generating schema error');

        Object.setPrototypeOf(this, new.target.prototype);
    }
}
