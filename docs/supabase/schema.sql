-- ============================================================================
-- ClinicMeta — Supabase Database Schema
-- Multi-tenant clinic & hospital management system
-- ============================================================================
-- Each table has:
--   - tenant_id for isolation
--   - RLS policies ensuring tenants can only see their own data
--   - Audit-friendly immutable fields (created_at, updated_at, version)
--   - Soft delete support (deleted_at)
-- ============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Helper: Auto-update updated_at ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TENANTS
-- ============================================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  features TEXT[] NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenants
  FOR ALL USING (auth.uid()::text = id::text OR auth.jwt()->>'role' IN ('admin', 'superadmin'));

-- ============================================================================
-- PATIENTS
-- ============================================================================
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  full_name TEXT NOT NULL,
  preferred_name TEXT,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL DEFAULT 'undisclosed' CHECK (gender IN ('male', 'female', 'other', 'undisclosed')),
  national_id TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'MX',
  blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  allergies TEXT,
  chronic_conditions TEXT,
  current_medications TEXT,
  primary_doctor_id UUID,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_group_number TEXT,
  marital_status TEXT,
  occupation TEXT,
  preferred_language TEXT DEFAULT 'es',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased', 'transferred')),
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  photo_url TEXT,
  last_visit_date TIMESTAMPTZ,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_patients_tenant ON patients(tenant_id);
CREATE INDEX idx_patients_status ON patients(tenant_id, status);
CREATE INDEX idx_patients_name ON patients(tenant_id, full_name);
CREATE INDEX idx_patients_doctor ON patients(tenant_id, primary_doctor_id);
CREATE INDEX idx_patients_search ON patients USING gin(to_tsvector('spanish', coalesce(full_name, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(email, '')));

CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY patient_tenant_isolation ON patients
  FOR ALL
  USING (tenant_id::text = (auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id::text = (auth.jwt()->>'tenant_id'));

CREATE POLICY patient_clinical_access ON patients
  FOR SELECT
  USING (
    auth.jwt()->>'role' IN ('doctor', 'nurse') 
    AND tenant_id::text = (auth.jwt()->>'tenant_id')
  );

-- ============================================================================
-- DOCTORS
-- ============================================================================
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  license_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  sub_specialties TEXT[] NOT NULL DEFAULT '{}',
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  office_number TEXT,
  department_id UUID,
  years_of_experience INTEGER,
  education TEXT,
  certifications TEXT[] NOT NULL DEFAULT '{}',
  languages TEXT[] NOT NULL DEFAULT '{es}',
  default_consult_duration INTEGER NOT NULL DEFAULT 30,
  consultation_fee NUMERIC(10,2),
  max_patients_per_day INTEGER,
  available_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  work_hours_start TIME DEFAULT '08:00',
  work_hours_end TIME DEFAULT '17:00',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'suspended')),
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  photo_url TEXT,
  rating NUMERIC(2,1),
  total_consultations INTEGER NOT NULL DEFAULT 0,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_doctors_tenant ON doctors(tenant_id);
CREATE INDEX idx_doctors_specialty ON doctors(tenant_id, specialty);
CREATE INDEX idx_doctors_status ON doctors(tenant_id, status);

CREATE TRIGGER trg_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY doctor_tenant_isolation ON doctors
  FOR ALL USING (tenant_id::text = (auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id::text = (auth.jwt()->>'tenant_id'));

-- ============================================================================
-- DEPARTMENTS
-- ============================================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  floor TEXT,
  building TEXT,
  phone_extension TEXT,
  head_doctor_id UUID REFERENCES doctors(id),
  parent_department_id UUID REFERENCES departments(id),
  operating_hours_start TIME DEFAULT '08:00',
  operating_hours_end TIME DEFAULT '17:00',
  is_24x7 BOOLEAN NOT NULL DEFAULT false,
  room_count INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  updated_by UUID,
  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_departments_tenant ON departments(tenant_id);

CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY dept_tenant_isolation ON departments
  FOR ALL USING (tenant_id::text = (auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id::text = (auth.jwt()->>'tenant_id'));

-- ============================================================================
-- APPOINTMENTS
-- ============================================================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  type TEXT NOT NULL DEFAULT 'consultation',
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'emergency')),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_rule TEXT,
  recurring_parent_id UUID REFERENCES appointments(id),
  room TEXT,
  confirmation_method TEXT,
  reminded_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by UUID,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  updated_by UUID,
  CONSTRAINT chk_appointment_times CHECK (scheduled_end > scheduled_start)
);

CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_patient ON appointments(tenant_id, patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(tenant_id, doctor_id);
CREATE INDEX idx_appointments_date ON appointments(tenant_id, scheduled_start);
CREATE INDEX idx_appointments_status ON appointments(tenant_id, status);
CREATE INDEX idx_appointments_overlap ON appointments(tenant_id, doctor_id, scheduled_start, scheduled_end)
  WHERE status NOT IN ('cancelled', 'no_show');

CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY appt_tenant_isolation ON appointments
  FOR ALL USING (tenant_id::text = (auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id::text = (auth.jwt()->>'tenant_id'));

-- ============================================================================
-- MEDICAL RECORDS (Expedientes Clínicos)
-- ============================================================================
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  appointment_id UUID REFERENCES appointments(id),
  type TEXT NOT NULL DEFAULT 'consultation',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'final', 'amended', 'cancelled')),
  chief_complaint TEXT NOT NULL,
  present_illness TEXT,
  physical_exam TEXT,
  vital_signs JSONB NOT NULL DEFAULT '{}',
  diagnoses JSONB NOT NULL DEFAULT '[]',
  treatment_plan TEXT,
  follow_up_instructions TEXT,
  lab_orders UUID[] DEFAULT '{}',
  imaging_orders UUID[] DEFAULT '{}',
  referrals JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  notes TEXT,
  encounter_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  signed_by UUID,
  signed_at TIMESTAMPTZ,
  shared_with_patient BOOLEAN NOT NULL DEFAULT false,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_medical_records_tenant ON medical_records(tenant_id);
CREATE INDEX idx_medical_records_patient ON medical_records(tenant_id, patient_id, encounter_date DESC);
CREATE INDEX idx_medical_records_doctor ON medical_records(tenant_id, doctor_id);
CREATE INDEX idx_medical_records_appointment ON medical_records(tenant_id, appointment_id);

CREATE TRIGGER trg_medical_records_updated_at BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY medrec_tenant_isolation ON medical_records
  FOR ALL USING (tenant_id::text = (auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id::text = (auth.jwt()->>'tenant_id'));

-- Only doctors can sign/finalize records
CREATE POLICY medrec_sign_by_doctor ON medical_records
  FOR UPDATE
  USING (
    tenant_id::text = (auth.jwt()->>'tenant_id') 
    AND (auth.jwt()->>'role' IN ('doctor', 'admin', 'superadmin'))
    AND (status NOT IN ('final', 'cancelled') OR auth.jwt()->>'role' = 'superadmin')
  );

-- ============================================================================
-- PRESCRIPTIONS
-- ============================================================================
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  medical_record_id UUID REFERENCES medical_records(id),
  appointment_id UUID REFERENCES appointments(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'dispensed', 'partially_dispensed', 'discontinued', 'expired')),
  medications JSONB NOT NULL DEFAULT '[]',
  diagnosis TEXT,
  total_days INTEGER,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  notes TEXT,
  printed BOOLEAN NOT NULL DEFAULT false,
  digital_signature TEXT,
  dispensed_at TEXT,
  dispensed_date TIMESTAMPTZ,
  dispensed_by UUID,
  discontinuation_reason TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX idx_prescriptions_tenant ON prescriptions(tenant_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(tenant_id, patient_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(tenant_id, status);

CREATE TRIGGER trg_prescriptions_updated_at BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY rx_tenant_isolation ON prescriptions
  FOR ALL USING (tenant_id::text = (auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id::text = (auth.jwt()->>'tenant_id'));

-- Only pharmacists can mark as dispensed
CREATE POLICY rx_dispense_by_pharmacist ON prescriptions
  FOR UPDATE
  USING (
    tenant_id::text = (auth.jwt()->>'tenant_id')
    AND (auth.jwt()->>'role' IN ('pharmacist', 'admin', 'superadmin'))
  );

-- ============================================================================
-- BILLING — INVOICES
-- ============================================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  invoice_number TEXT NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  doctor_id UUID REFERENCES doctors(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'cancelled', 'refunded', 'collection')),
  issue_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ,
  items JSONB NOT NULL DEFAULT '[]',
  sub_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MXN',
  tax_id TEXT,
  invoice_type TEXT NOT NULL DEFAULT 'recibo' CHECK (invoice_type IN ('factura', 'recibo', 'nota_venta')),
  cfdi_uuid TEXT,
  sent_to_patient BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  updated_by UUID,
  UNIQUE(tenant_id, invoice_number)
);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_patient ON invoices(tenant_id, patient_id);
CREATE INDEX idx_invoices_status ON invoices(tenant_id, status);
CREATE INDEX idx_invoices_due ON invoices(tenant_id, due_date) WHERE status IN ('sent', 'partial');

CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY inv_tenant_isolation ON invoices
  FOR ALL USING (tenant_id::text = (auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id::text = (auth.jwt()->>'tenant_id'));

-- Prevent deletion of paid/cancelled invoices
CREATE POLICY inv_no_delete_paid ON invoices
  FOR DELETE
  USING (status NOT IN ('paid', 'cancelled', 'refunded'));

-- ════════════════════════════════════════════════════════════════════════════
-- DOUBLE-ENTRY LEDGER — INMUTABLE
-- Every payment, refund, adjustment creates an entry here.
-- Entries can NEVER be modified or deleted (enforced at DB level).
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  entry_number INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'insurance', 'voucher', 'other')),
  reference TEXT,
  account_code TEXT NOT NULL,
  running_balance NUMERIC(10,2) NOT NULL,
  entry_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_ledger_invoice ON ledger_entries(tenant_id, invoice_id, entry_number);

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- Ledger entries are read-only — no UPDATE or DELETE allowed
CREATE POLICY ledger_tenant_isolation ON ledger_entries
  FOR SELECT USING (tenant_id::text = (auth.jwt()->>'tenant_id'));

CREATE POLICY ledger_insert_only ON ledger_entries
  FOR INSERT WITH CHECK (
    tenant_id::text = (auth.jwt()->>'tenant_id')
    AND (auth.jwt()->>'role' IN ('billing', 'admin', 'superadmin'))
  );

-- ============================================================================
-- INVENTORY
-- ============================================================================
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unit',
  sku TEXT,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  minimum_quantity INTEGER NOT NULL DEFAULT 10,
  maximum_quantity INTEGER NOT NULL DEFAULT 100,
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(10,2),
  supplier TEXT,
  supplier_code TEXT,
  lot_number TEXT,
  expiration_date TIMESTAMPTZ,
  location TEXT,
  is_controlled BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'out_of_stock',
  notes TEXT,
  department_id UUID REFERENCES departments(id),
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID,
  updated_by UUID,
  UNIQUE(tenant_id, sku)
);

CREATE INDEX idx_inventory_tenant ON inventory_items(tenant_id);
CREATE INDEX idx_inventory_category ON inventory_items(tenant_id, category);
CREATE INDEX idx_inventory_status ON inventory_items(tenant_id, status);
CREATE INDEX idx_inventory_controlled ON inventory_items(tenant_id, is_controlled) WHERE is_controlled = true;

CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY inv_item_tenant_isolation ON inventory_items
  FOR ALL USING (tenant_id::text = (auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id::text = (auth.jwt()->>'tenant_id'));

-- ════════════════════════════════════════════════════════════════════════════
-- INVENTORY TRANSACTIONS
-- Every stock movement is recorded. Like the ledger, entries are immutable.
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  type TEXT NOT NULL CHECK (type IN ('reception', 'dispense', 'transfer', 'adjustment', 'expiry', 'return')),
  quantity INTEGER NOT NULL,
  running_quantity INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  reason TEXT,
  lot_number TEXT,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inv_tx_item ON inventory_transactions(tenant_id, item_id, transaction_date DESC);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY inv_tx_tenant_isolation ON inventory_transactions
  FOR SELECT USING (tenant_id::text = (auth.jwt()->>'tenant_id'));

CREATE POLICY inv_tx_insert ON inventory_transactions
  FOR INSERT WITH CHECK (
    tenant_id::text = (auth.jwt()->>'tenant_id')
    AND (auth.jwt()->>'role' IN ('nurse', 'pharmacist', 'admin', 'superadmin'))
  );

-- ============================================================================
-- AUDIT TRAIL (cross-entity)
-- ============================================================================
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'status_change', 'sign', 'dispense', 'payment', 'refund')),
  changes JSONB NOT NULL DEFAULT '{}',
  previous_data JSONB,
  performed_by UUID,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_audit_tenant ON audit_trail(tenant_id, performed_at DESC);
CREATE INDEX idx_audit_entity ON audit_trail(tenant_id, entity_type, entity_id);

ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_tenant_read ON audit_trail
  FOR SELECT USING (tenant_id::text = (auth.jwt()->>'tenant_id'));

CREATE POLICY audit_insert_all ON audit_trail
  FOR INSERT WITH CHECK (tenant_id::text = (auth.jwt()->>'tenant_id'));

-- No UPDATE or DELETE on audit trail — immutable by design
-- (No UPDATE/DELETE policies = denied by default)

-- ============================================================================
-- SYNC QUEUE (for offline-first)
-- ============================================================================
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  data JSONB NOT NULL,
  previous_data JSONB,
  client_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'conflict', 'failed')),
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  server_version INTEGER
);

CREATE INDEX idx_sync_tenant ON sync_queue(tenant_id, status);
CREATE INDEX idx_sync_client ON sync_queue(client_id, status);

ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY sync_tenant_isolation ON sync_queue
  FOR ALL USING (tenant_id::text = (auth.jwt()->>'tenant_id'))
  WITH CHECK (tenant_id::text = (auth.jwt()->>'tenant_id'));

-- ============================================================================
-- VIEWS for Analytics
-- ============================================================================

-- Daily appointment count
CREATE VIEW clinic_daily_appointments AS
SELECT
  tenant_id,
  scheduled_start::date AS appointment_date,
  doctor_id,
  status,
  COUNT(*) AS appointment_count
FROM appointments
WHERE deleted_at IS NULL
GROUP BY tenant_id, scheduled_start::date, doctor_id, status;

-- Revenue by month
CREATE VIEW clinic_monthly_revenue AS
SELECT
  tenant_id,
  date_trunc('month', issue_date) AS month,
  COUNT(*) AS invoice_count,
  SUM(total_amount) AS total_billed,
  SUM(paid_amount) AS total_collected,
  SUM(balance_due) AS outstanding
FROM invoices
WHERE deleted_at IS NULL AND status != 'cancelled'
GROUP BY tenant_id, date_trunc('month', issue_date);

-- Inventory alerts
CREATE VIEW clinic_inventory_alerts AS
SELECT
  tenant_id,
  id,
  name,
  quantity_on_hand,
  minimum_quantity,
  status,
  CASE
    WHEN quantity_on_hand = 0 THEN 'OUT_OF_STOCK'
    WHEN quantity_on_hand <= minimum_quantity THEN 'LOW_STOCK'
    WHEN expiration_date IS NOT NULL AND expiration_date <= now() + INTERVAL '30 days' THEN 'EXPIRING_SOON'
    ELSE 'OK'
  END AS alert_level
FROM inventory_items
WHERE deleted_at IS NULL;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT := to_char(now(), 'YYYY');
  v_last_num INTEGER;
  v_prefix TEXT;
BEGIN
  SELECT settings->'clinic'->'billing'->>'invoicePrefix', 
         COALESCE((settings->'clinic'->'billing'->>'invoiceStartNumber')::INTEGER, 1)
  INTO v_prefix
  FROM tenants WHERE id = p_tenant_id;
  
  v_prefix := COALESCE(v_prefix, 'FAC-');
  
  SELECT COALESCE(MAX(SUBSTRING(invoice_number FROM '\d+$')::INTEGER), 0)
  INTO v_last_num
  FROM invoices
  WHERE tenant_id = p_tenant_id AND invoice_number LIKE v_prefix || '%';
  
  RETURN v_prefix || v_year || '-' || LPAD((v_last_num + 1)::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check for appointment time conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflict(
  p_doctor_id UUID,
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conflict BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM appointments
    WHERE doctor_id = p_doctor_id
      AND status NOT IN ('cancelled', 'no_show')
      AND deleted_at IS NULL
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
      AND scheduled_start < p_end
      AND scheduled_end > p_start
  ) INTO v_conflict;
  
  RETURN v_conflict;
END;
$$ LANGUAGE plpgsql;
