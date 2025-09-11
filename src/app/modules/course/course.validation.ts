// src/app/modules/course/course.validation.ts
import { z } from "zod";

const createCourseValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title cannot be empty").max(200, "Title too long"),
    
    price: z.number().min(0, "Price cannot be negative"),
    
    description: z.string().min(10, "Description must be at least 10 characters"),
    
    thumbnail: z.string().url("Must be a valid URL"),
  }),
});

const updateCourseValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title cannot be empty").max(200, "Title too long").optional(),
    price: z.number().min(0, "Price cannot be negative").optional(),
    description: z.string().min(10, "Description must be at least 10 characters").optional(),
    thumbnail: z.string().url("Must be a valid URL").optional(),
  }),
});

const createModuleValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title cannot be empty").max(200, "Title too long"),
    courseId: z.string(),
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
    
    pdfNotes: z.array(z.string().url("Must be valid URL")).optional().default([]),
    
    moduleId: z.string(),
  }),
});

const updateLectureValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title cannot be empty").max(200, "Title too long").optional(),
    videoUrl: z.string().url("Must be a valid URL").optional(),
    pdfNotes: z.array(z.string().url("Must be valid URL")).optional(),
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