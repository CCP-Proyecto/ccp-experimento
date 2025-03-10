import { Hono } from "hono";
import { db } from "./db/connection";
import { inventories, products } from "./db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const app = new Hono();

app.get("/product", async (c) => {
  const productsData = await db.select().from(products);

  return c.json(productsData);
});

app.get("/product/:id", async (c) => {
  const productId = c.req.param("id");
  const productData = await db
    .select()
    .from(products)
    .where(eq(products.id, Number(productId)));

  if (!productData.length) {
    return c.json({ message: "Product not found" }, 404);
  }

  return c.json(productData[0]);
});

app.post("/product", async (c) => {
  const productBody = await c.req.json();

  const productSchema = z.object({
    name: z.string(),
    price: z.number(),
  });

  const productData = productSchema.safeParse(productBody);

  if (!productData.success) {
    return c.json({ message: "Invalid product data" }, 400);
  }

  const product = await db.insert(products).values({
    name: productData.data.name,
    price: String(productData.data.price),
  });

  return c.json(product);
});

app.get("/inventory", async (c) => {
  const inventoryData = await db.select().from(inventories);

  return c.json(inventoryData);
});

app.get("/inventory/:id", async (c) => {
  const inventoryId = c.req.param("id");
  const inventoryData = await db
    .select({
      inventoryId: inventories.id,
      productId: inventories.productId,
      quantity: inventories.quantity,
      product: {
        id: products.id,
        name: products.name,
        price: products.price,
      },
    })
    .from(inventories)
    .leftJoin(products, eq(inventories.productId, products.id))
    .where(eq(inventories.productId, Number(inventoryId)));

  if (!inventoryData.length) {
    return c.json({ message: "Inventory not found" }, 404);
  }

  return c.json(inventoryData[0]);
});

app.post("/inventory", async (c) => {
  const inventoryBody = await c.req.json();

  const inventorySchema = z.object({
    productId: z.number(),
    quantity: z.number(),
  });

  const inventoryData = inventorySchema.safeParse(inventoryBody);

  if (!inventoryData.success) {
    return c.json({ message: "Invalid inventory data" }, 400);
  }

  const inventory = await db.insert(inventories).values({
    productId: inventoryData.data.productId,
    quantity: inventoryData.data.quantity,
  });

  return c.json(inventory);
});

app.put("/inventory/:id", async (c) => {
  const inventoryId = c.req.param("id");
  const inventoryBody = await c.req.json();

  const inventorySchema = z.object({
    quantity: z.number(),
    operation: z.enum(["add", "sell"]),
  });

  const inventoryData = inventorySchema.safeParse(inventoryBody);

  if (!inventoryData.success) {
    return c.json({ message: "Invalid inventory data" }, 400);
  }

  let quantity;

  if (inventoryData.data.operation === "add") {
    quantity = inventoryData.data.quantity;
  }

  if (inventoryData.data.operation === "sell") {
    quantity = -inventoryData.data.quantity;
  }

  if (quantity === undefined) {
    return c.json({ message: "Invalid operation" }, 400);
  }

  const updatedInventory = await db
    .update(inventories)
    .set({
      quantity: sql`${inventories.quantity} + ${quantity}`,
    })
    .where(eq(inventories.id, Number(inventoryId)))
    .returning();

  if (updatedInventory.length === 0) {
    return c.json({ message: "Inventory not found" }, 404);
  }

  return c.json(updatedInventory[0]);
});

export default {
  port: process.env.PORT,
  fetch: app.fetch,
};
