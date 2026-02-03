-- Seed data for development

-- Insert a default user
INSERT OR IGNORE INTO users (id, email, name, role) VALUES
  ('user_1', 'zane@example.com', 'Zane', 'admin');

-- Insert sample companies
INSERT OR IGNORE INTO companies (id, name, domain, industry, size, city, state) VALUES
  ('company_1', 'Acme Corporation', 'acme.com', 'Technology', '51-200', 'San Francisco', 'CA'),
  ('company_2', 'TechStart Inc', 'techstart.io', 'Software', '11-50', 'Austin', 'TX'),
  ('company_3', 'Global Solutions', 'globalsolutions.com', 'Consulting', '201-500', 'New York', 'NY'),
  ('company_4', 'Innovate Labs', 'innovatelabs.co', 'Technology', '1-10', 'Seattle', 'WA'),
  ('company_5', 'Summit Enterprises', 'summitent.com', 'Manufacturing', '500+', 'Chicago', 'IL');

-- Insert sample contacts
INSERT OR IGNORE INTO contacts (id, first_name, last_name, email, phone, company_id, title) VALUES
  ('contact_1', 'John', 'Smith', 'john.smith@acme.com', '+1-555-0101', 'company_1', 'CEO'),
  ('contact_2', 'Sarah', 'Johnson', 'sarah.j@techstart.io', '+1-555-0102', 'company_2', 'VP of Sales'),
  ('contact_3', 'Michael', 'Williams', 'mwilliams@globalsolutions.com', '+1-555-0103', 'company_3', 'Procurement Manager'),
  ('contact_4', 'Emily', 'Brown', 'emily@innovatelabs.co', '+1-555-0104', 'company_4', 'Founder'),
  ('contact_5', 'David', 'Davis', 'ddavis@summitent.com', '+1-555-0105', 'company_5', 'IT Director');

-- Insert sample leads
INSERT OR IGNORE INTO leads (id, name, email, phone, company_name, title, status, source, assigned_to, score) VALUES
  ('lead_1', 'Alice Chen', 'alice.chen@startup.com', '+1-555-0201', 'NextGen Startup', 'CTO', 'new', 'website', 'user_1', 75),
  ('lead_2', 'Bob Martinez', 'bob.m@enterprise.com', '+1-555-0202', 'Enterprise Co', 'VP Engineering', 'contacted', 'linkedin', 'user_1', 60),
  ('lead_3', 'Carol White', 'cwhite@consulting.com', '+1-555-0203', 'White Consulting', 'Owner', 'qualified', 'referral', 'user_1', 85),
  ('lead_4', 'Dan Lee', 'dan@techfirm.com', '+1-555-0204', 'Tech Firm LLC', 'Manager', 'new', 'cold_email', 'user_1', 40),
  ('lead_5', 'Eva Green', 'eva.g@digital.com', '+1-555-0205', 'Digital Agency', 'Director', 'contacted', 'event', 'user_1', 55);

-- Insert sample deals
INSERT OR IGNORE INTO deals (id, name, value, stage_id, probability, expected_close_date, contact_id, company_id, assigned_to, status) VALUES
  ('deal_1', 'Acme Enterprise License', 50000, 'stage_3', 50, '2026-03-15', 'contact_1', 'company_1', 'user_1', 'open'),
  ('deal_2', 'TechStart Annual Contract', 25000, 'stage_2', 25, '2026-04-01', 'contact_2', 'company_2', 'user_1', 'open'),
  ('deal_3', 'Global Solutions Expansion', 120000, 'stage_4', 75, '2026-02-28', 'contact_3', 'company_3', 'user_1', 'open'),
  ('deal_4', 'Innovate Labs Pilot', 8000, 'stage_1', 10, '2026-05-01', 'contact_4', 'company_4', 'user_1', 'open'),
  ('deal_5', 'Summit Integration Project', 75000, 'stage_3', 50, '2026-03-30', 'contact_5', 'company_5', 'user_1', 'open');

-- Insert sample activities
INSERT OR IGNORE INTO activities (id, type, subject, description, status, due_date, contact_id, deal_id, user_id) VALUES
  ('activity_1', 'call', 'Discovery Call', 'Initial discovery call to understand requirements', 'completed', '2026-02-01 10:00:00', 'contact_1', 'deal_1', 'user_1'),
  ('activity_2', 'email', 'Send Proposal', 'Send detailed proposal document', 'pending', '2026-02-05 09:00:00', 'contact_1', 'deal_1', 'user_1'),
  ('activity_3', 'meeting', 'Demo Presentation', 'Product demo for the team', 'pending', '2026-02-10 14:00:00', 'contact_2', 'deal_2', 'user_1'),
  ('activity_4', 'task', 'Prepare Contract', 'Draft final contract terms', 'pending', '2026-02-08 12:00:00', 'contact_3', 'deal_3', 'user_1'),
  ('activity_5', 'note', 'Meeting Notes', 'Discussed pricing concerns, will follow up with discount options', 'completed', '2026-02-02 16:00:00', 'contact_5', 'deal_5', 'user_1');
