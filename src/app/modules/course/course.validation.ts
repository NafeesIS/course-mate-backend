// src/app/modules/course/course.validation.ts
import { z } from "zod";

const createCourseValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title cannot be empty").max(200, "Title too long"),
    price: z.string(),
    description: z.string().min(10, "Description must be at least 10 characters"),
  }),
});

const updateCourseValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title cannot be empty").max(200, "Title too long").optional(),
    price: z.string().optional(),
    description: z.string().min(10, "Description must be at least 10 characters").optional(),
  }),
});

const createModuleValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title cannot be empty").max(200, "Title too long"),
  }),
});

const updateModuleValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title cannot be empty").max(200, "Title too long").optional(),
  }),
});

const createLectureValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title cannot be empty").max(200, "Title too long"),
    videoUrl: z.string().url("Must be a valid URL"),
  }),
});

const updateLectureValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title cannot be empty").max(200, "Title too long").optional(),
    videoUrl: z.string().url("Must be a valid URL").optional(),
  }),
});

export const CourseValidation = {
  createCourseValidationSchema,
  updateCourseValidationSchema,
  createModuleValidationSchema,
  updateModuleValidationSchema,
  createLectureValidationSchema,
  updateLectureValidationSchema,
};