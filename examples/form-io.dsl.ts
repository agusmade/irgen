
import { frontend } from "../src/dsl/frontend-runtime";

const app = frontend("FormIOApp", (app) => {
  app.page("UserPage", { path: "/users" }, (page) => {
    page.component("UserForm", (c) => {
      // Standard Input
      c.field("fullName", "text", "Full Name", { required: true, minLength: 3 }, {
        placeholder: "John Doe",
        prefix: "👤",
        tooltip: "Your full legal name",
        helpHtml: "Gunakan nama lengkap sesuai identitas."
      });

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

      // Confirm Password (compare field)
      c.field("confirmPassword", "password", "Confirm Password", { equalsField: "password" }, {
        icon: "Lock",
        helpHtml: "Harus sama dengan password di atas."
      });

      // Phone & URL with suffix/prefix
      c.field("phone", "phone", "Phone Number", { required: true }, {
        prefix: "+62",
        placeholder: "8123456789",
        tooltip: "Format angka saja"
      });
      c.field("website", "url", "Website", {}, {
        suffix: ".com",
        placeholder: "mycompany"
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
          valueKey: "id",
          searchParam: "q",
          pageParam: "page",
          pageSizeParam: "pageSize",
          pageSize: 20,
          debounceMs: 250,
        },
        placeholder: "Select Department...",
        clearable: true,
        searchPlaceholder: "Cari departemen..."
      });

      // Number with Icon & Validation
      c.field("age", "number", "Age", { min: 18, max: 120 }, {
        icon: "Hash"
      });

      // Date/DateTime/Time/DateRange
      c.field("startDate", "date", "Start Date", { required: true });
      c.field("appointment", "datetime", "Appointment", {});
      c.field("meetingTime", "time", "Meeting Time", {});
      c.field("vacation", "daterange", "Vacation Period", { minDate: "2024-01-01", maxDate: "2026-12-31" });

      // Currency & Slider & Tags & File & Signature
      c.field("salaryExpectation", "currency", "Expected Salary", { min: 3000000 }, {
        defaultCurrency: "Rp",
        prefix: "Rp",
        helpHtml: "Masukkan angka tanpa titik/koma."
      });
      c.field("experienceLevel", "slider", "Experience (years)", { min: 0, max: 20 }, {
        step: 1,
        suffix: "yrs"
      });
      c.field("skills", "tags", "Skills", {}, {
        placeholder: "Ketik skill lalu Enter",
        tooltip: "Bisa lebih dari satu"
      });
      c.field("resume", "file", "Resume (PDF)", {}, {
        accept: ".pdf",
        tooltip: "Upload PDF max 2MB"
      });
      c.field("signature", "signature", "Signature (data URL)", {}, {
        placeholder: "Paste base64 signature",
        helpHtml: "Contoh: data:image/png;base64,iVBORw0K..."
      });
    });
  });

  app.page("LayoutDemo", { path: "/layout" }, (page) => {
    page.component("InfoPanel");
    page.component("RowExample");
    page.component("TabsExample");
    page.component("HeroContent");
    page.component("CTAButton");
  });

  // Layout examples use real child components (valid identifiers)
  app.component("InfoPanel", (c) => { c.layout = { kind: "panel", title: "Panel Container", items: ["PanelItemA", "PanelItemB", "PanelItemC"] }; });
  app.component("PanelItemA", (c) => { c.content = "Panel item A content"; });
  app.component("PanelItemB", (c) => { c.content = "Panel item B content"; });
  app.component("PanelItemC", (c) => { c.content = "Panel item C content"; });

  app.component("RowExample", (c) => { c.layout = { kind: "row", title: "Row Layout", columns: 3, items: ["ColOne", "ColTwo", "ColThree"] }; });
  app.component("ColOne", (c) => { c.content = "Col one body"; });
  app.component("ColTwo", (c) => { c.content = "Col two body"; });
  app.component("ColThree", (c) => { c.content = "Col three body"; });

  app.component("TabsExample", (c) => { c.layout = { kind: "tabs", title: "Tabs Layout", tabs: [{ label: "Overview", content: "Overview tab content", items: ["OverviewCard"] }, { label: "Details", content: "Detail tab content", items: ["DetailsCard"] }] }; });
  app.component("OverviewCard", (c) => { c.content = "Overview card inside tab"; });
  app.component("DetailsCard", (c) => { c.content = "Details card inside tab"; });

  app.component("HeroContent", (c) => { c.content = "## Hero block\n\nContent block to show static info in Markdown."; });
  app.component("CTAButton", (c) => { c.button = { label: "Take Action", variant: "primary", icon: "Rocket" }; });
});
