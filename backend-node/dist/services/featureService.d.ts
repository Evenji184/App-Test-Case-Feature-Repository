import { Feature } from '../db/models';
export declare function listFeatures(params: {
    nodeId?: string;
    nodeIds?: string[];
    keyword?: string;
    page?: number;
    pageSize?: number;
    includeHidden?: boolean;
}): Promise<{
    total: number;
    items: Feature[];
}>;
export declare function getFeatureDetail(featureId: string): Promise<Feature | null>;
export declare function searchFeatures(keyword: string): Promise<Feature[]>;
export declare function createFeature(params: {
    nodeId: string;
    title: string;
    code: string;
    summary?: string;
    description?: string;
    platform?: string;
    priority?: string;
    operatorId: string;
    operatorUsername: string;
    ipAddress?: string;
}): Promise<Feature>;
export declare function updateFeature(params: {
    featureId: string;
    title?: string;
    summary?: string | null;
    description?: string | null;
    platform?: string | null;
    priority?: string | null;
    expectedUpdatedAt?: Date | null;
    operatorId: string;
    operatorUsername: string;
    ipAddress?: string;
}): Promise<Feature>;
export declare function deleteFeature(featureId: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<void>;
export declare function hideFeature(featureId: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<void>;
export declare function showFeature(featureId: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<void>;
export declare function copyFeature(featureId: string, targetNodeId: string | null, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<Feature>;
export declare function moveFeature(featureId: string, targetNodeId: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<Feature>;
//# sourceMappingURL=featureService.d.ts.map