import { body } from "express-validator";

export const patientValidators = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .matches(/^[A-Za-z\s]+$/u)
    .withMessage("Full name should contain letters and spaces only"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Email is invalid")
    .custom((value: string) => value.toLowerCase().endsWith("@gmail.com"))
    .withMessage("Email must be a @gmail.com address"),
  body("phoneCountryCode")
    .trim()
    .matches(/^\+\d{1,4}$/)
    .withMessage("Country code must start with + followed by digits"),
  body("phoneNumber")
    .trim()
    .matches(/^\d{6,15}$/)
    .withMessage("Phone number must contain between 6 and 15 digits"),
];

