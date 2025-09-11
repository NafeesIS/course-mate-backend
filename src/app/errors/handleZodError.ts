import { ZodError } from "zod";
import { TErrorSources, TGenericErrorResponse } from "../interface/error";

const handleZodError = (err: ZodError): TGenericErrorResponse => {
  const statusCode = 400;

  const errorSources: TErrorSources = err.issues.map((issue) => {
    const path = issue?.path[issue.path.length - 1];
    return {
      path: typeof path === "string" || typeof path === "number" ? path : String(path),
      message: issue?.message,
    };
  });

  return {
    statusCode,
    message: "Validation Error",
    errorSources,
  };
};

export default handleZodError;
