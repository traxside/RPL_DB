-- Create extension for UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Management
CREATE TABLE IF NOT EXISTS "User" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL, -- Added password field for authentication
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Pasien" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  gender VARCHAR(10),
  status VARCHAR(20) NOT NULL,
  alamat TEXT,
  emergency_contact VARCHAR(100),
  blood_type VARCHAR(5),
  riwayat_penyakit TEXT,
  obat_dikonsumsi TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Dokter" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  spesialisasi VARCHAR(100) NOT NULL,
  jadwal JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Admin" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Apoteker" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Medical Records
CREATE TABLE IF NOT EXISTS "MedicalRecord" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pasien_id UUID NOT NULL REFERENCES "Pasien"(id) ON DELETE CASCADE,
  dokter_id UUID NOT NULL REFERENCES "Dokter"(id),
  heartrate INTEGER,
  tension VARCHAR(20),
  blood_sugar DECIMAL(5,2),
  diagnosis TEXT NOT NULL,
  symptoms TEXT,
  notes TEXT,
  treatment_plan TEXT,
  record_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Consultation" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pasien_id UUID NOT NULL REFERENCES "Pasien"(id) ON DELETE CASCADE,
  dokter_id UUID NOT NULL REFERENCES "Dokter"(id),
  consultation_date TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL,
  hasil_konsultasi TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Medication Management
CREATE TABLE IF NOT EXISTS "Obat" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama VARCHAR(100) NOT NULL,
  kategori VARCHAR(50),
  manufacturer VARCHAR(100),
  dosis VARCHAR(50),
  deskripsi TEXT,
  efek_samping TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Inventory" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  obat_id UUID NOT NULL REFERENCES "Obat"(id) ON DELETE CASCADE,
  jumlah INTEGER NOT NULL,
  tanggal_kadaluarsa DATE,
  harga DECIMAL(10,2) NOT NULL,
  supplier VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Reminder" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pasien_id UUID NOT NULL REFERENCES "Pasien"(id) ON DELETE CASCADE,
  obat_id UUID NOT NULL REFERENCES "Obat"(id) ON DELETE CASCADE,
  reminder_time TIME NOT NULL,
  dosage VARCHAR(50) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Order Processing
CREATE TABLE IF NOT EXISTS "Order" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pasien_id UUID NOT NULL REFERENCES "Pasien"(id) ON DELETE CASCADE,
  total_harga DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  obat_id UUID NOT NULL REFERENCES "Obat"(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Payment" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES "Order"(id) ON DELETE SET NULL,
  consultation_id UUID REFERENCES "Consultation"(id) ON DELETE SET NULL,
  pasien_id UUID NOT NULL REFERENCES "Pasien"(id),
  payment_method VARCHAR(50) NOT NULL,
  insurance_claim_number VARCHAR(100),
  insurance_provider VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply the trigger to all tables with updated_at column
CREATE TRIGGER update_user_modtime BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_pasien_modtime BEFORE UPDATE ON "Pasien" FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_dokter_modtime BEFORE UPDATE ON "Dokter" FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_admin_modtime BEFORE UPDATE ON "Admin" FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_apoteker_modtime BEFORE UPDATE ON "Apoteker" FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_medical_record_modtime BEFORE UPDATE ON "MedicalRecord" FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_consultation_modtime BEFORE UPDATE ON "Consultation" FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_obat_modtime BEFORE UPDATE ON "Obat" FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_inventory_modtime BEFORE UPDATE ON "Inventory" FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_reminder_modtime BEFORE UPDATE ON "Reminder" FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_order_modtime BEFORE UPDATE ON "Order" FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_payment_modtime BEFORE UPDATE ON "Payment" FOR EACH ROW EXECUTE PROCEDURE update_modified_column();