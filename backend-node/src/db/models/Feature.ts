import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

export interface FeatureAttributes {
  id: string;
  node_id: string;
  title: string;
  code: string;
  summary: string | null;
  description: string | null;
  platform: string | null;
  priority: string | null;
  status: string;
  version: string | null;
  tags: string | null;
  is_visible: boolean;
  is_archived: boolean;
  remark: string | null;
  source_feature_id: string | null;
  copied_from_id: string | null;
  moved_from_node_id: string | null;
  move_operation_id: string | null;
  copy_operation_id: string | null;
  last_copied_at: Date | null;
  last_moved_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
}

export type FeatureCreationAttributes = Optional<
  FeatureAttributes,
  'id' | 'summary' | 'description' | 'platform' | 'priority' | 'status' | 'version' | 'tags' |
  'is_visible' | 'is_archived' | 'remark' | 'source_feature_id' | 'copied_from_id' |
  'moved_from_node_id' | 'move_operation_id' | 'copy_operation_id' |
  'last_copied_at' | 'last_moved_at' |
  'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by' | 'deleted_by'
>;

export class Feature extends Model<FeatureAttributes, FeatureCreationAttributes> implements FeatureAttributes {
  declare id: string;
  declare node_id: string;
  declare title: string;
  declare code: string;
  declare summary: string | null;
  declare description: string | null;
  declare platform: string | null;
  declare priority: string | null;
  declare status: string;
  declare version: string | null;
  declare tags: string | null;
  declare is_visible: boolean;
  declare is_archived: boolean;
  declare remark: string | null;
  declare source_feature_id: string | null;
  declare copied_from_id: string | null;
  declare moved_from_node_id: string | null;
  declare move_operation_id: string | null;
  declare copy_operation_id: string | null;
  declare last_copied_at: Date | null;
  declare last_moved_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
  declare created_by: string | null;
  declare updated_by: string | null;
  declare deleted_by: string | null;
}

Feature.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    node_id: { type: DataTypes.CHAR(36), allowNull: false },
    title: { type: DataTypes.STRING(500), allowNull: false },
    code: { type: DataTypes.STRING(100), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    platform: { type: DataTypes.STRING(100), allowNull: true },
    priority: { type: DataTypes.STRING(20), allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' },
    version: { type: DataTypes.STRING(50), allowNull: true },
    tags: { type: DataTypes.TEXT, allowNull: true },
    is_visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_archived: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    remark: { type: DataTypes.TEXT, allowNull: true },
    source_feature_id: { type: DataTypes.CHAR(36), allowNull: true },
    copied_from_id: { type: DataTypes.CHAR(36), allowNull: true },
    moved_from_node_id: { type: DataTypes.CHAR(36), allowNull: true },
    move_operation_id: { type: DataTypes.CHAR(36), allowNull: true },
    copy_operation_id: { type: DataTypes.CHAR(36), allowNull: true },
    last_copied_at: { type: DataTypes.DATE, allowNull: true },
    last_moved_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.CHAR(36), allowNull: true },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_by: { type: DataTypes.CHAR(36), allowNull: true },
  },
  {
    sequelize,
    tableName: 'features',
    modelName: 'Feature',
    timestamps: false,
  }
);
