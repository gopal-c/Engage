-- BirthdayHub now reads employee data from skillshub.profiles.
-- Drop the birthdayhub.employees table; send_logs.employee_id is denormalized (name stored inline).

-- Remove FK from send_logs before dropping the table
ALTER TABLE birthdayhub.send_logs DROP CONSTRAINT IF EXISTS send_logs_employee_id_fkey;

-- Remove FK from scheduled_sends before dropping the table
ALTER TABLE birthdayhub.scheduled_sends DROP CONSTRAINT IF EXISTS scheduled_sends_employee_id_fkey;

DROP TABLE IF EXISTS birthdayhub.employees;
