import {
  type InferSchemaType,
  type Model,
  model,
  models,
  Schema,
  type Types,
} from "mongoose";

const orderStatuses = ["pending", "paid", "failed", "cancelled"] as const;
const paymentProviders = ["paystack", "pesapal"] as const;

const orderItemSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new Schema(
  {
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => value.length > 0,
        message: "Order must include at least one item.",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: orderStatuses,
      default: "pending",
      required: true,
    },
    paymentProvider: {
      type: String,
      enum: paymentProviders,
      required: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ paymentProvider: 1, createdAt: -1 });

export type OrderDocument = InferSchemaType<typeof orderSchema> & {
  paymentId: Types.ObjectId | null;
};

export const Order: Model<OrderDocument> =
  models.Order || model<OrderDocument>("Order", orderSchema);
