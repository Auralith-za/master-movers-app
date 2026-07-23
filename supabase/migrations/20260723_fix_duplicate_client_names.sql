-- Function to clean duplicate consecutive words/phrases in client_name
-- e.g. "Marné Van Aarde Van Aarde" -> "Marné Van Aarde"
CREATE OR REPLACE FUNCTION clean_client_name(input_name TEXT) 
RETURNS TEXT AS $$
DECLARE
    cleaned TEXT;
BEGIN
    IF input_name IS NULL THEN
        RETURN NULL;
    END IF;
    
    cleaned := TRIM(input_name);
    
    -- Replace consecutive duplicate words or phrases (case insensitive)
    -- Repeat regexp_replace to handle nested/multiple repetitions
    LOOP
        EXIT WHEN cleaned !~* '(?i)\b(.+?)\s+\1\b';
        cleaned := regexp_replace(cleaned, '(?i)\b(.+?)\s+\1\b', '\1', 'g');
        cleaned := TRIM(cleaned);
    END LOOP;
    
    RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to sanitize client_name before insert or update on quotes table
CREATE OR REPLACE FUNCTION sanitize_quote_client_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_name IS NOT NULL THEN
        NEW.client_name := clean_client_name(NEW.client_name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to public.quotes
DROP TRIGGER IF EXISTS trigger_sanitize_quote_client_name ON public.quotes;
CREATE TRIGGER trigger_sanitize_quote_client_name
BEFORE INSERT OR UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION sanitize_quote_client_name();

-- One-time update to clean existing quotes in database with duplicate names
UPDATE public.quotes 
SET client_name = clean_client_name(client_name)
WHERE client_name IS NOT NULL AND client_name ~* '(?i)\b(.+?)\s+\1\b';
