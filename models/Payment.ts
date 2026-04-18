import {
  type InferSchemaType,
  type Model,
  model,
  models,
  Schema,
} from "mongoose";

const paymentProviders = ["paystack", "pesapal"] as const;
const paymentStatuses = [
  "pending",
  "initialized",
  "successful",
  "failed",
  "cancelled",
] as const;

const paymentSchema = new Schema(
  {
    provider: {
      type: String,
      enum: paymentProviders,
      required: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: paymentStatuses,
      default: "pending",
      required: true,
    },
    rawResponse: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ reference: 1 }, { unique: true });

export type PaymentDocument = InferSchemaType<typeof paymentSchema>;

export const Payment: Model<PaymentDocument> =
  models.Payment || model<PaymentDocument>("Payment", paymentSchema);
