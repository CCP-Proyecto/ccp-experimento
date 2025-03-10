import { integer, pgTable, serial, text, numeric } from "drizzle-orm/pg-core";

export const products = pgTable("product", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: numeric("price").notNull(),
});

export const inventories = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(0),
});
