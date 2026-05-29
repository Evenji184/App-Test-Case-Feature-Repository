import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

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

export type FeatureNodeCreationAttributes = Optional<
  FeatureNodeAttributes,
  'id' | 'remark' | 'parent_id' | 'node_type' | 'sort_order' | 'is_visible' | 'is_locked' |
  'source_node_id' | 'copied_from_node_id' | 'moved_from_node_id' |
  'move_operation_id' | 'copy_operation_id' |
  'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by' | 'deleted_by'
>;

export class FeatureNode extends Model<FeatureNodeAttributes, FeatureNodeCreationAttributes> implements FeatureNodeAttributes {
  declare id: string;
  declare name: string;
  declare code: string;
  declare remark: string | null;
  declare parent_id: string | null;
  declare node_type: string;
  declare path: string;
  declare level: number;
  declare sort_order: number;
  declare is_visible: boolean;
  declare is_locked: boolean;
  declare source_node_id: string | null;
  declare copied_from_node_id: string | null;
  declare moved_from_node_id: string | null;
  declare move_operation_id: string | null;
  declare copy_operation_id: string | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
  declare created_by: string | null;
  declare updated_by: string | null;
  declare deleted_by: string | null;
}

FeatureNode.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    code: { type: DataTypes.STRING(100), allowNull: false },
    remark: { type: DataTypes.TEXT, allowNull: true },
    parent_id: { type: DataTypes.CHAR(36), allowNull: true },
    node_type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'normal' },
    path: { type: DataTypes.STRING(1000), allowNull: false },
    level: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    is_visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_locked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    source_node_id: { type: DataTypes.CHAR(36), allowNull: true },
    copied_from_node_id: { type: DataTypes.CHAR(36), allowNull: true },
    moved_from_node_id: { type: DataTypes.CHAR(36), allowNull: true },
    move_operation_id: { type: DataTypes.CHAR(36), allowNull: true },
    copy_operation_id: { type: DataTypes.CHAR(36), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  },
  {
    sequelize,
    tableName: 'feature_nodes',
    modelName: 'FeatureNode',
    timestamps: false,
  }
);
