-- Migration: 007_contracts_form_data_columns.sql
-- Split form_data JSONB into individual columns for contracts.

-- Core client & location
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS service_address TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS zip TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS location_contact_name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS location_contact_phone TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS location_contact_name_phone TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS city_state_zip TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS location_contact_email TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS authorized_person_name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS authorized_person_title TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS authorized_person_email TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS authorized_person_phone TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS effective_date TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS term_start_date TEXT;

-- Costs
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS implementation_cost TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS shipping_fee TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS monthly_robotic_service_cost TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS additional_accessories_cost TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS total_monthly_cost TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS implementation_cost_due TEXT;

-- Discount (used for calculations)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS discount_target TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS discount_type TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS discount_value TEXT;

-- Monthly quantities
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_tim_e_bot TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_tim_e_charger TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_base_metal_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_insulated_food_transport_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_wheeled_bin_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_universal_platform_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_door_openers_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_neural_tech_brain_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_elevator_hardware_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_luggage_cart_monthly TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_concession_bin_tall TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_stacking_chair_cart TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_cargo_cart TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_housekeeping_cart TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_bime TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_mobile_bime TEXT;

-- One-time quantities
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_base_metal_one_time TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_insulated_food_transport_one_time TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_wheeled_bin_one_time TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_universal_platform_one_time TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_plastic_bags TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_door_opener_hardware_one_time TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS qty_handheld_tablet TEXT;

-- Signature (data URL can be long)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tech_force_signature TEXT;

-- Backfill from existing form_data
UPDATE contracts
SET
  business_name = form_data->>'businessName',
  service_address = form_data->>'serviceAddress',
  city = form_data->>'city',
  state = form_data->>'state',
  zip = form_data->>'zip',
  location_contact_name = form_data->>'locationContactName',
  location_contact_phone = form_data->>'locationContactPhone',
  location_contact_name_phone = form_data->>'locationContactNamePhone',
  city_state_zip = form_data->>'cityStateZip',
  location_contact_email = form_data->>'locationContactEmail',
  authorized_person_name = form_data->>'authorizedPersonName',
  authorized_person_title = form_data->>'authorizedPersonTitle',
  authorized_person_email = form_data->>'authorizedPersonEmail',
  authorized_person_phone = form_data->>'authorizedPersonPhone',
  effective_date = form_data->>'effectiveDate',
  term_start_date = form_data->>'termStartDate',
  implementation_cost = form_data->>'implementationCost',
  shipping_fee = form_data->>'shippingFee',
  monthly_robotic_service_cost = form_data->>'monthlyRoboticServiceCost',
  additional_accessories_cost = form_data->>'additionalAccessoriesCost',
  total_monthly_cost = form_data->>'totalMonthlyCost',
  implementation_cost_due = form_data->>'implementationCostDue',
  discount_target = form_data->>'discountTarget',
  discount_type = form_data->>'discountType',
  discount_value = form_data->>'discountValue',
  qty_tim_e_bot = form_data->>'qtyTimEBot',
  qty_tim_e_charger = form_data->>'qtyTimECharger',
  qty_base_metal_monthly = form_data->>'qtyBaseMetalMonthly',
  qty_insulated_food_transport_monthly = form_data->>'qtyInsulatedFoodTransportMonthly',
  qty_wheeled_bin_monthly = form_data->>'qtyWheeledBinMonthly',
  qty_universal_platform_monthly = form_data->>'qtyUniversalPlatformMonthly',
  qty_door_openers_monthly = form_data->>'qtyDoorOpenersMonthly',
  qty_neural_tech_brain_monthly = form_data->>'qtyNeuralTechBrainMonthly',
  qty_elevator_hardware_monthly = form_data->>'qtyElevatorHardwareMonthly',
  qty_luggage_cart_monthly = form_data->>'qtyLuggageCartMonthly',
  qty_concession_bin_tall = form_data->>'qtyConcessionBinTall',
  qty_stacking_chair_cart = form_data->>'qtyStackingChairCart',
  qty_cargo_cart = form_data->>'qtyCargoCart',
  qty_housekeeping_cart = form_data->>'qtyHousekeepingCart',
  qty_bime = form_data->>'qtyBIME',
  qty_mobile_bime = form_data->>'qtyMobileBIME',
  qty_base_metal_one_time = form_data->>'qtyBaseMetalOneTime',
  qty_insulated_food_transport_one_time = form_data->>'qtyInsulatedFoodTransportOneTime',
  qty_wheeled_bin_one_time = form_data->>'qtyWheeledBinOneTime',
  qty_universal_platform_one_time = form_data->>'qtyUniversalPlatformOneTime',
  qty_plastic_bags = form_data->>'qtyPlasticBags',
  qty_door_opener_hardware_one_time = form_data->>'qtyDoorOpenerHardwareOneTime',
  qty_handheld_tablet = form_data->>'qtyHandheldTablet',
  tech_force_signature = form_data->>'techForceSignature'
WHERE form_data IS NOT NULL;
