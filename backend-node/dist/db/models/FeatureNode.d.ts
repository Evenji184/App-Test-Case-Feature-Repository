import { Model, Optional } from 'sequelize';
export interface FeatureNodeAttributes {
    id: string;
    name: string;
    code: string;
    remark: string | null;
    parent_id: string | null;
    node_type: string;
    path: string;
    level: number;
    sort_order: number;
    is_visible: boolean;
    is_locked: boolean;
    source_node_id: string | null;
    copied_from_node_id: string | null;
    moved_from_node_id: string | null;
    move_operation_id: string | null;
    copy_operation_id: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}
export type FeatureNodeCreationAttributes = Optional<FeatureNodeAttributes, 'id' | 'remark' | 'parent_id' | 'node_type' | 'sort_order' | 'is_visible' | 'is_locked' | 'source_node_id' | 'copied_from_node_id' | 'moved_from_node_id' | 'move_operation_id' | 'copy_operation_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by' | 'deleted_by'>;
export declare class FeatureNode extends Model<FeatureNodeAttributes, FeatureNodeCreationAttributes> implements FeatureNodeAttributes {
    id: string;
    name: string;
    code: string;
    remark: string | null;
    parent_id: string | null;
    node_type: string;
    path: string;
    level: number;
    sort_order: number;
    is_visible: boolean;
    is_locked: boolean;
    source_node_id: string | null;
    copied_from_node_id: string | null;
    moved_from_node_id: string | null;
    move_operation_id: string | null;
    copy_operation_id: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}
//# sourceMappingURL=FeatureNode.d.ts.map