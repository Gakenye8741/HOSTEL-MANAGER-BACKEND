import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { uuid } from 'drizzle-orm/pg-core';
import { pgTable, varchar, decimal, boolean, timestamp, integer, text, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';

// Enums for rigid data control
export const userRoleEnum = pgEnum('user_role', ['admin', 'landlord', 'caretaker', 'tenant']);
export const paymentMethodEnum = pgEnum('payment_provider', ['paypal', 'mpesa', 'bank_transfer', 'stripe']);
export const billingCycleEnum = pgEnum('billing_cycle', ['monthly', 'semester', 'yearly']);
export const propertyTypeEnum = pgEnum('property_type', ['hostel',   'apartment',   'studio',   'bedsitter',   'commercial',   'mixed_use']);
export const ticketStatusEnum = pgEnum('ticket_status', ['pending', 'in_progress', 'resolved', 'closed']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high', 'urgent']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed', 'cancelled']);
export const docTypeEnum = pgEnum('doc_type', ['lease_agreement', 'id_copy', 'receipt', 'property_deed', 'other']);

export const users = pgTable('users', {
  // --- Core Identity ---
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  username: varchar('username', { length: 50 }).unique(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  passwordHash: text('password_hash'),
  authProviderId: varchar('auth_provider_id', { length: 255 }),
  avatarUrl: text('avatar_url'),
  idNumber: varchar('id_number', { length: 50 }),
  role: userRoleEnum('role').default('landlord').notNull(),
  hostelId: uuid('hostel_id').references(() => properties.id),

  // --- Security & Status ---
  isVerified: boolean('is_verified').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  otpHash: varchar('otp_hash', { length: 255 }), 
  otpExpiresAt: timestamp('otp_expires_at'),
  otpAttempts: integer('otp_attempts').default(0), 
  lockedUntil: timestamp('locked_until'),
  
  // --- Terms & Conditions ---
  termsAccepted: boolean('terms_accepted').default(false).notNull(),
  termsAcceptedAt: timestamp('terms_accepted_at'),
  
  // --- Auditing & Metadata ---
  lastLogin: timestamp('last_login'),
  lastLoginIp: varchar('last_login_ip', { length: 45 }),
  passwordChangedAt: timestamp('password_changed_at'),
  metadata: jsonb('metadata').default({}), 
  deletedAt: timestamp('deleted_at'), // Essential for Soft Delete functionality
  
  // --- Timestamps ---
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}) as any;


export const properties = pgTable('properties', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  landlordId: uuid('landlord_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('property_name', { length: 150 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 255 }).notNull(),
  mapCoordinates: jsonb('map_coordinates').default({ lat: 0, lng: 0 }),
  hasBasePrice: boolean('has_base_price').default(true),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).default('0.00'),
  propertyType: propertyTypeEnum('property_type').default('hostel'),
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}) as any;

export const propertyPaymentMethods = pgTable('property_payment_methods', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  provider: paymentMethodEnum('provider').notNull(),
  credentials: jsonb('credentials').notNull(), 
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userPermissions = pgTable('user_permissions', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  canManageMaintenance: boolean('can_manage_maintenance').default(false),
  canViewFinance: boolean('can_view_finance').default(false),
  canManageTenants: boolean('can_manage_tenants').default(false),
  canEditPropertyInfo: boolean('can_edit_property_info').default(false),
  grantedBy: uuid('granted_by').references(() => users.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const units = pgTable('units', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  unitName: varchar('unit_name', { length: 50 }).notNull(),
  rentAmount: decimal('rent_amount', { precision: 10, scale: 2 }).notNull(),
  billingCycle: billingCycleEnum('billing_cycle').default('semester'),
  commissionRate: decimal('commission_rate', { precision: 3, scale: 2 }).default('0.03'),
  assetInventory: jsonb('asset_inventory').default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({ 
  unitsPropertyIdIdx: index('units_property_id_idx').on(table.propertyId) 
}));

export const tenants = pgTable('tenants', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  email: varchar('email', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leases = pgTable('leases', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  unitId: uuid('unit_id').references(() => units.id, { onDelete: 'cascade' }).notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }).notNull(),
  leaseId: uuid('lease_id').references(() => leases.id, { onDelete: 'set null' }),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  grossAmount: decimal('gross_amount', { precision: 12, scale: 2 }).notNull(),
  platformFee: decimal('platform_fee', { precision: 12, scale: 2 }).notNull(),
  netAmount: decimal('net_amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  transactionReference: varchar('txn_ref', { length: 100 }).unique().notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({ 
  txnIdx: index('txn_idx').on(table.transactionReference),
  propIdx: index('prop_idx').on(table.propertyId)
}));

export const maintenanceTickets = pgTable('maintenance_tickets', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  unitId: uuid('unit_id').references(() => units.id, { onDelete: 'cascade' }).notNull(),
  tenantId: uuid('tenant_id').references(() => users.id, { onDelete: 'set null' }).notNull(),
  description: text('description').notNull(),
  status: ticketStatusEnum('status').default('pending'),
  priority: ticketPriorityEnum('priority').default('medium'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const expenses = pgTable('expenses', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  category: varchar('category', { length: 50 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  date: timestamp('date').defaultNow().notNull(),
});

export const securityDeposits = pgTable('security_deposits', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  leaseId: uuid('lease_id').references(() => leases.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('held'),
});

export const utilityTypeEnum = pgEnum('utility_type', ['electricity', 'water', 'internet', 'gas']);

export const utilityMeters = pgTable('utility_meters', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  unitId: uuid('unit_id').references(() => units.id, { onDelete: 'cascade' }).notNull(),
  type: utilityTypeEnum('type').notNull(),
  meterNumber: varchar('meter_number', { length: 50 }).notNull(),
});

export const utilityReadings = pgTable('utility_readings', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  meterId: uuid('meter_id').references(() => utilityMeters.id, { onDelete: 'cascade' }).notNull(),
  readingValue: decimal('reading_value', { precision: 12, scale: 2 }).notNull(),
  recordedBy: uuid('recorded_by').references(() => users.id),
  date: timestamp('date').defaultNow().notNull(),
});

export const amenities = pgTable('amenities', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }),
});

export const amenityBookings = pgTable('amenity_bookings', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  amenityId: uuid('amenity_id').references(() => amenities.id, { onDelete: 'cascade' }).notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
});

export const documents = pgTable('documents', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  docUrl: text('doc_url').notNull(),
  docType: docTypeEnum('doc_type').default('other'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  tableName: varchar('table_name', { length: 50 }),
  recordId: uuid('record_id'), 
  timestamp: timestamp('timestamp').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  assignedTo: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: taskStatusEnum('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  permissions: many(userPermissions),
  maintenanceTickets: many(maintenanceTickets),
  notifications: many(notifications),
  tasks: many(tasks), 
  auditLogs: many(auditLogs),
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, { fields: [userPermissions.userId], references: [users.id] }),
  property: one(properties, { fields: [userPermissions.propertyId], references: [properties.id] }),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  landlord: one(users, { fields: [properties.landlordId], references: [users.id] }),
  units: many(units),
  transactions: many(transactions),
  expenses: many(expenses),
  amenities: many(amenities),
  documents: many(documents),
  tasks: many(tasks),
  paymentMethods: many(propertyPaymentMethods),
  permissions: many(userPermissions),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  property: one(properties, { fields: [units.propertyId], references: [properties.id] }),
  leases: many(leases),
  maintenanceTickets: many(maintenanceTickets),
  utilityMeters: many(utilityMeters),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  leases: many(leases),
  transactions: many(transactions),
  amenityBookings: many(amenityBookings),
}));

export const leasesRelations = relations(leases, ({ one, many }) => ({
  unit: one(units, { fields: [leases.unitId], references: [units.id] }),
  tenant: one(tenants, { fields: [leases.tenantId], references: [tenants.id] }),
  transactions: many(transactions),
  securityDeposits: many(securityDeposits),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  property: one(properties, { fields: [transactions.propertyId], references: [properties.id] }),
  lease: one(leases, { fields: [transactions.leaseId], references: [leases.id] }),
  tenant: one(tenants, { fields: [transactions.tenantId], references: [tenants.id] }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  property: one(properties, { fields: [expenses.propertyId], references: [properties.id] }),
}));

export const securityDepositsRelations = relations(securityDeposits, ({ one }) => ({
  lease: one(leases, { fields: [securityDeposits.leaseId], references: [leases.id] }),
}));

export const maintenanceTicketsRelations = relations(maintenanceTickets, ({ one }) => ({
  unit: one(units, { fields: [maintenanceTickets.unitId], references: [units.id] }),
  tenant: one(users, { fields: [maintenanceTickets.tenantId], references: [users.id] }),
}));

export const utilityMetersRelations = relations(utilityMeters, ({ one, many }) => ({
  unit: one(units, { fields: [utilityMeters.unitId], references: [units.id] }),
  readings: many(utilityReadings),
}));

export const utilityReadingsRelations = relations(utilityReadings, ({ one }) => ({
  meter: one(utilityMeters, { fields: [utilityReadings.meterId], references: [utilityMeters.id] }),
  recordedBy: one(users, { fields: [utilityReadings.recordedBy], references: [users.id] }),
}));

export const amenitiesRelations = relations(amenities, ({ one, many }) => ({
  property: one(properties, { fields: [amenities.propertyId], references: [properties.id] }),
  bookings: many(amenityBookings),
}));

export const amenityBookingsRelations = relations(amenityBookings, ({ one }) => ({
  amenity: one(amenities, { fields: [amenityBookings.amenityId], references: [amenities.id] }),
  tenant: one(tenants, { fields: [amenityBookings.tenantId], references: [tenants.id] }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  property: one(properties, { fields: [documents.propertyId], references: [properties.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  property: one(properties, { fields: [tasks.propertyId], references: [properties.id] }),
  assignedUser: one(users, { fields: [tasks.assignedTo], references: [users.id] }),
}));

export type TSelectUser = typeof users.$inferSelect;
export type TInsertUser = typeof users.$inferInsert;
export type TSelectPermission = typeof userPermissions.$inferSelect;
export type TInsertPermission = typeof userPermissions.$inferInsert;
export type TSelectProperty = typeof properties.$inferSelect;
export type TInsertProperty = typeof properties.$inferInsert;
export type TSelectPropertyPaymentMethod = typeof propertyPaymentMethods.$inferSelect;
export type TInsertPropertyPaymentMethod = typeof propertyPaymentMethods.$inferInsert;
export type TSelectUnit = typeof units.$inferSelect;
export type TInsertUnit = typeof units.$inferInsert;
export type TSelectTenant = typeof tenants.$inferSelect;
export type TInsertTenant = typeof tenants.$inferInsert;
export type TSelectLease = typeof leases.$inferSelect;
export type TInsertLease = typeof leases.$inferInsert;
export type TSelectTransaction = typeof transactions.$inferSelect;
export type TInsertTransaction = typeof transactions.$inferInsert;
export type TSelectExpense = typeof expenses.$inferSelect;
export type TInsertExpense = typeof expenses.$inferInsert;
export type TSelectSecurityDeposit = typeof securityDeposits.$inferSelect;
export type TInsertSecurityDeposit = typeof securityDeposits.$inferInsert;
export type TSelectMaintenanceTicket = typeof maintenanceTickets.$inferSelect;
export type TInsertMaintenanceTicket = typeof maintenanceTickets.$inferInsert;
export type TSelectUtilityMeter = typeof utilityMeters.$inferSelect;
export type TInsertUtilityMeter = typeof utilityMeters.$inferInsert;
export type TSelectUtilityReading = typeof utilityReadings.$inferSelect;
export type TInsertUtilityReading = typeof utilityReadings.$inferInsert;
export type TSelectAmenity = typeof amenities.$inferSelect;
export type TInsertAmenity = typeof amenities.$inferInsert;
export type TSelectAmenityBooking = typeof amenityBookings.$inferSelect;
export type TInsertAmenityBooking = typeof amenityBookings.$inferInsert;
export type TSelectDocument = typeof documents.$inferSelect;
export type TInsertDocument = typeof documents.$inferInsert;
export type TSelectNotification = typeof notifications.$inferSelect;
export type TInsertNotification = typeof notifications.$inferInsert;
export type TSelectAuditLog = typeof auditLogs.$inferSelect;
export type TInsertAuditLog = typeof auditLogs.$inferInsert;
export type TSelectTask = typeof tasks.$inferSelect;
export type TInsertTask = typeof tasks.$inferInsert;