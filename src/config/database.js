import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

// Add a middleware to convert Decimal values to numbers
prisma.$use(async (params, next) => {
  const result = await next(params);

  const convertDecimals = (data) => {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
      return data.map(convertDecimals);
    }

    if (data instanceof Date) {
      return data;
    }

    if (typeof data === "object") {
      const converted = {};
      for (const key in data) {
        const value = data[key];
        // Check if it's a Decimal type
        if (
          value &&
          typeof value === "object" &&
          (value.constructor?.name === "Decimal" ||
            typeof value.toFixed === "function")
        ) {
          converted[key] = parseFloat(value.toString());
        } else if (typeof value === "object") {
          converted[key] = convertDecimals(value);
        } else {
          converted[key] = value;
        }
      }
      return converted;
    }

    return data;
  };

  return convertDecimals(result);
});

prisma
  .$connect()
  .then(() => {
    console.log("✅ Database connected successfully");
  })
  .catch((error) => {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  });

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
