
import { frontend } from "../src/dsl/frontend-runtime";

const app = frontend("FormIOApp", (app) => {
  app.page("UserPage", { path: "/users" }, (page) => {
    page.component("UserForm", (c) => {
      // Standard Input
      c.field("fullName", "text", "Full Name", { required: true, minLength: 3 });

      // Input with Icon & Placeholder + pattern
      c.field("email", "email", "Email Address", { required: true, pattern: ".+@.+" }, {
        icon: "Mail",
        placeholder: "user@example.com",
        description: "We'll never share your email."
      });

      // Password with min length
      c.field("password", "password", "Password", { required: true, minLength: 6 }, {
        icon: "Lock"
      });

      // Textarea
      c.field("bio", "textarea", "Bio", { maxLength: 200 }, {
        placeholder: "Short bio (max 200 chars)"
      });

      // Static Select
      c.field("role", "select", "User Role", { required: true }, {
        options: [
          { label: "Admin", value: "admin" },
          { label: "User", value: "user" },
          { label: "Guest", value: "guest" }
        ]
      });

      // Radio (static options)
      c.field("accessLevel", "radio", "Access Level", { required: true }, {
        options: [
          { label: "Read", value: "read" },
          { label: "Write", value: "write" },
          { label: "Admin", value: "admin" },
        ]
      });

      // Checkbox (boolean)
      c.field("newsletter", "checkbox", "Subscribe to newsletter", {});

      // Async Select
      c.field("department", "select", "Department", {}, {
        dataSource: {
          url: "https://api.example.com/departments",
          labelKey: "name",
          valueKey: "id"
        },
        placeholder: "Select Department..."
      });

      // Number with Icon & Validation
      c.field("age", "number", "Age", { min: 18, max: 120 }, {
        icon: "Hash"
      });

      // Date/DateTime
      c.field("startDate", "date", "Start Date", { required: true });
      c.field("appointment", "datetime", "Appointment", {});
    });
  });
});
