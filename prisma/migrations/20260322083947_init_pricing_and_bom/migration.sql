-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "customerGroup" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "sku" TEXT,
    "name" TEXT,
    "basePrice" DECIMAL,
    "productionTimeStd" INTEGER,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_default_products" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "defaultQuantity" INTEGER DEFAULT 1,

    CONSTRAINT "customer_default_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "customerId" UUID,
    "orderDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "deadlineDelivery" TIMESTAMP(3),
    "status" TEXT DEFAULT 'draft',

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" UUID,
    "quantity" INTEGER,
    "isCustomAdded" BOOLEAN DEFAULT false,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "type" TEXT,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "minStock" DECIMAL NOT NULL DEFAULT 0,
    "stockQuantity" DECIMAL NOT NULL DEFAULT 0,
    "referencePrice" DECIMAL NOT NULL DEFAULT 0,
    "purchasePrice" DECIMAL,
    "purchaseQuantity" DECIMAL,
    "unit_price" DECIMAL GENERATED ALWAYS AS ("purchasePrice" / NULLIF("purchaseQuantity", 0)) STORED,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_items" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quantity" DECIMAL NOT NULL,

    CONSTRAINT "bom_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_transactions" (
    "id" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "partnerId" UUID,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "price" DECIMAL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_locations" (
    "id" UUID NOT NULL,
    "itemName" TEXT,
    "quantity" DECIMAL,
    "currentLocationId" UUID,
    "isReadyForAssembly" BOOLEAN DEFAULT false,
    "lastUpdated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_orders" (
    "id" UUID NOT NULL,
    "orderId" UUID,
    "productId" UUID,
    "quantityTarget" INTEGER,
    "quantityCompleted" INTEGER DEFAULT 0,
    "deadlineProduction" TIMESTAMP(3),
    "currentStatus" TEXT,

    CONSTRAINT "production_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_logs" (
    "id" UUID NOT NULL,
    "productionOrderId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "staffName" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "quantityProduced" INTEGER NOT NULL DEFAULT 0,
    "technical_error_count" INTEGER NOT NULL DEFAULT 0,
    "material_error_count" INTEGER NOT NULL DEFAULT 0,
    "error_note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "evidence_image_url" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_material_estimates" (
    "id" UUID NOT NULL,
    "productionOrderId" UUID NOT NULL,
    "materialName" TEXT NOT NULL,
    "requiredQuantity" DECIMAL NOT NULL,
    "isShortage" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "production_material_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" UUID NOT NULL,
    "orderId" UUID,
    "packageCode" TEXT,
    "weight" DECIMAL,
    "dimensions" TEXT,
    "status" TEXT DEFAULT 'packing',

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packing_list_details" (
    "id" UUID NOT NULL,
    "packageId" UUID,
    "productId" UUID,
    "quantity" INTEGER,

    CONSTRAINT "packing_list_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "materials_sku_key" ON "materials"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "bom_items_productId_materialId_key" ON "bom_items"("productId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "packages_packageCode_key" ON "packages"("packageCode");

-- AddForeignKey
ALTER TABLE "customer_default_products" ADD CONSTRAINT "customer_default_products_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_default_products" ADD CONSTRAINT "customer_default_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_transactions" ADD CONSTRAINT "material_transactions_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_transactions" ADD CONSTRAINT "material_transactions_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_locations" ADD CONSTRAINT "inventory_locations_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_material_estimates" ADD CONSTRAINT "production_material_estimates_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_list_details" ADD CONSTRAINT "packing_list_details_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_list_details" ADD CONSTRAINT "packing_list_details_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
