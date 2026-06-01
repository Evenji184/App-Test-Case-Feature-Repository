import { FeatureNode } from '../db/models';
export declare function getNodeTree(): Promise<FeatureNode[]>;
export declare function listNodes(params: {
    keyword?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    total: number;
    items: FeatureNode[];
}>;
export declare function getNodeDetail(nodeId: string): Promise<FeatureNode | null>;
export declare function searchNodes(keyword: string): Promise<FeatureNode[]>;
export declare function createNode(params: {
    name: string;
    code: string;
    description?: string;
    parentId?: string | null;
    sortOrder?: number;
    operatorId: string;
    operatorUsername: string;
    ipAddress?: string;
}): Promise<FeatureNode>;
export declare function updateNode(params: {
    nodeId: string;
    name?: string;
    code?: string;
    description?: string | null;
    parentId?: string | null;
    sortOrder?: number;
    operatorId: string;
    operatorUsername: string;
    ipAddress?: string;
}): Promise<FeatureNode>;
export declare function deleteNode(nodeId: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<void>;
export declare function hideNode(nodeId: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<void>;
export declare function showNode(nodeId: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<void>;
export declare function copyNode(nodeId: string, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<FeatureNode>;
export declare function moveNode(nodeId: string, targetParentId: string | null, operatorId: string, operatorUsername: string, ipAddress?: string): Promise<FeatureNode>;
//# sourceMappingURL=nodeService.d.ts.map