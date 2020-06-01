import { GraphQLResolveInfo } from 'graphql';
import {BaseResolverMetadata} from "../metadata/definitions";

export interface ArgsDictionary {
    [argName: string]: any;
}

export interface ResolverData<ContextType = {}> {
    root: any;
    args: ArgsDictionary;
    context: ContextType;
    info: GraphQLResolveInfo;
    resolverMetadata: any
}
