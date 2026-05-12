import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
};