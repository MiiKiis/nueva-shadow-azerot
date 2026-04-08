-- SOAP auth fix helper for AzerothCore auth DB
-- Usage: set the username in the first line and run on the server DB.

SET @soap_user := 'miikiis';

-- 1) Validate account exists
SELECT id, username
FROM account
WHERE UPPER(username) = UPPER(@soap_user);

-- 2A) Newer schema flavor: account_access(id, gmlevel, RealmID)
-- Ensure GM level 3 globally
INSERT INTO account_access (id, gmlevel, RealmID)
SELECT a.id, 3, -1
FROM account a
WHERE UPPER(a.username) = UPPER(@soap_user)
ON DUPLICATE KEY UPDATE gmlevel = GREATEST(gmlevel, 3), RealmID = -1;

-- 2B) Alternate schema flavor: account_access(AccountID, SecurityLevel, RealmID)
-- Uncomment this block if your table uses AccountID/SecurityLevel names.
-- INSERT INTO account_access (AccountID, SecurityLevel, RealmID)
-- SELECT a.id, 3, -1
-- FROM account a
-- WHERE UPPER(a.username) = UPPER(@soap_user)
-- ON DUPLICATE KEY UPDATE SecurityLevel = GREATEST(SecurityLevel, 3), RealmID = -1;

-- 3) Final verification (for gmlevel schema)
SELECT aa.*
FROM account_access aa
JOIN account a ON a.id = aa.id
WHERE UPPER(a.username) = UPPER(@soap_user);

-- 4) Final verification (for SecurityLevel schema)
-- SELECT aa.*
-- FROM account_access aa
-- JOIN account a ON a.id = aa.AccountID
-- WHERE UPPER(a.username) = UPPER(@soap_user);
