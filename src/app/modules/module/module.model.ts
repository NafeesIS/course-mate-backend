// Module Schema
import { IModule } from "./module.interface";
import { Schema, model } from "mongoose";

const moduleSchema = new Schema<IModule>(
  {
    title: { type: String, required: true },
    moduleNumber: { type: Number, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "courses", required: true },
  },
  { timestamps: true }
);

export const ModuleModel = model<IModule>("modules", moduleSchema, "modules");
