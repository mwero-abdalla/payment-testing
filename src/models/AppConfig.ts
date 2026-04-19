import {
  type InferSchemaType,
  type Model,
  model,
  models,
  Schema,
} from "mongoose";

const appConfigSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

appConfigSchema.index({ key: 1 }, { unique: true });

export type AppConfigDocument = InferSchemaType<typeof appConfigSchema>;

export const AppConfig: Model<AppConfigDocument> =
  models.AppConfig || model<AppConfigDocument>("AppConfig", appConfigSchema);
