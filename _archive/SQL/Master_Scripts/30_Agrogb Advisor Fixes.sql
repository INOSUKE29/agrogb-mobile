Help me to debug the attached sql snippet which gives the following error:

Failed to run sql query: ERROR: 0A000: extension "pg_partman" does not support SET SCHEMA

-- =========================================================================================...



Reasoned
I’ll first pull Supabase/Postgres documentation for ALTER EXTENSION ... SET SCHEMA and any known limitations around pg_partman, then we’ll adjust your script accordingly.


Ran load_knowledge

Ran search_docs

Ran search_docs

Ran search_docs

Reasoned
I’ll rerun the documentation search with the correct GraphQL query format to find details about ALTER EXTENSION ... SET SCHEMA and pg_partman.


Ran search_docs

Ran search_docs

Ran search_docs

Ran search_docs

Reasoned
Why you’re getting this error
ALTER EXTENSION pg_partman SET SCHEMA extensions; fails with:

0A000: extension "pg_partman" does not support SET SCHEMA

That means your installed pg_partman extension is not “relocatable” (or at least not configured to allow moving its objects to another schema via ALTER EXTENSION ... SET SCHEMA). In Postgres, only some extensions support that operation.

Supabase’s docs recommend enabling pg_partman directly in a dedicated schema using:

SQL Query



create schema if not exists partman;
create extension if not exists pg_partman with schema partman;

So, instead of “moving” it, you generally create it in the target schema from the start.

Fix options
Option A (recommended): Don’t relocate—just ensure it’s created in the right schema
If pg_partman is already installed in public, you can’t use CREATE EXTENSION ... WITH SCHEMA ... without first dropping the existing extension.

✅ Replace this line in your script:

SQL Query



ALTER EXTENSION pg_partman SET SCHEMA extensions;

🚫 With something like this (destructive warning ⚠️: dropping the extension can break existing partition setup if you already configured it):

SQL Query



-- ⚠️ WARNING: dropping the extension can break existing pg_partman-managed partitions.
-- Use only if you're sure you can recreate the extension + its config safely.
DROP EXTENSION IF EXISTS pg_partman CASCADE;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_partman WITH SCHEMA extensions;

After that, your existing calls like partman.create_parent(...) must match the schema you installed into (i.e. extensions.* vs partman.*). In your script you call partman.run_maintenance_proc()—that assumes the extension schema is partman.

So if you install into extensions, you’ll likely need to call:

extensions.run_maintenance_proc() (and similar functions)
or install it into a schema named partman (closer to Supabase’s docs)
Option B: Install into partman schema (matches Supabase docs)
Change your intent to the schema name Supabase recommends:

SQL Query



CREATE SCHEMA IF NOT EXISTS partman;
CREATE EXTENSION IF NOT EXISTS pg_partman WITH SCHEMA partman;

If pg_partman is currently installed elsewhere, you still may need to drop/recreate as above.

Quick question (to choose the safest path)
Is pg_partman already being used/configured in this database (e.g. you already called partman.create_parent(...) or have partitions created)?

If yes, tell me the current extension schema (or share the output of select extnamespace::regnamespace from pg_extension where extname='pg_partman';), and I’ll give you the least disruptive migration approach.
If no, Option A/B is straightforward.


Supabase AI may not always produce correct answers. Double check responses.

Ask a follow up question...

