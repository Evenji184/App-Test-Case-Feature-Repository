export interface JwtPayload {
    sub: string;
    username: string;
    iat?: number;
    exp?: number;
}
export declare function createToken(userId: string, username: string): string;
export declare function verifyToken(token: string): JwtPayload;
//# sourceMappingURL=jwt.d.ts.map