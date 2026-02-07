-- Add pta_approved column to phone_inventory table
ALTER TABLE phone_inventory
ADD COLUMN pta_approved BOOLEAN DEFAULT FALSE NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN phone_inventory.pta_approved IS 'Indicates if the phone is PTA approved for use in Pakistan';
