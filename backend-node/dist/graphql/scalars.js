"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateTimeScalar = void 0;
const graphql_1 = require("graphql");
exports.DateTimeScalar = new graphql_1.GraphQLScalarType({
    name: 'DateTime',
    description: 'ISO 8601 datetime string',
    serialize(value) {
        if (value instanceof Date) {
            return value.toISOString();
        }
        if (typeof value === 'string') {
            return new Date(value).toISOString();
        }
        return null;
    },
    parseValue(value) {
        if (typeof value === 'string' || typeof value === 'number') {
            return new Date(value);
        }
        return null;
    },
    parseLiteral(ast) {
        if (ast.kind === graphql_1.Kind.STRING) {
            return new Date(ast.value);
        }
        return null;
    },
});
//# sourceMappingURL=scalars.js.map