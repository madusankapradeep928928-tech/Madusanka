-- Use separate triggers for INSERT and UPDATE to keep it clean and avoid when issues
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Trigger on INSERT for cases where confirmed_at is not null (verification off)
CREATE TRIGGER on_auth_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Trigger on UPDATE for cases where user confirms email later (verification on)
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();
