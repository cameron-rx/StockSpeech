


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."count_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stock_count_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "quantity" numeric,
    "raw_transcription" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "confidence" numeric
);


ALTER TABLE "public"."count_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."product_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_list_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "unit" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "email" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_counts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "product_list_id" "uuid",
    "name" "text" NOT NULL,
    "completed" "text" DEFAULT 'in_progress'::"text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "stock_counts_status_check" CHECK (("completed" = ANY (ARRAY['in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."stock_counts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venue_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'staff'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "venue_users_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'staff'::"text"])))
);


ALTER TABLE "public"."venue_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."venues" OWNER TO "postgres";


ALTER TABLE ONLY "public"."count_items"
    ADD CONSTRAINT "count_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_lists"
    ADD CONSTRAINT "product_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_counts"
    ADD CONSTRAINT "stock_counts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_users"
    ADD CONSTRAINT "venue_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue_users"
    ADD CONSTRAINT "venue_users_venue_id_user_id_key" UNIQUE ("venue_id", "user_id");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_pkey" PRIMARY KEY ("id");



CREATE INDEX "count_items_product_id_idx" ON "public"."count_items" USING "btree" ("product_id");



CREATE INDEX "count_items_stock_count_id_idx" ON "public"."count_items" USING "btree" ("stock_count_id");



CREATE INDEX "product_lists_venue_id_idx" ON "public"."product_lists" USING "btree" ("venue_id");



CREATE INDEX "products_product_list_id_idx" ON "public"."products" USING "btree" ("product_list_id");



CREATE INDEX "stock_counts_user_id_idx" ON "public"."stock_counts" USING "btree" ("user_id");



CREATE INDEX "stock_counts_venue_id_idx" ON "public"."stock_counts" USING "btree" ("venue_id");



CREATE INDEX "venue_users_user_id_idx" ON "public"."venue_users" USING "btree" ("user_id");



CREATE INDEX "venue_users_venue_id_idx" ON "public"."venue_users" USING "btree" ("venue_id");



ALTER TABLE ONLY "public"."count_items"
    ADD CONSTRAINT "count_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."count_items"
    ADD CONSTRAINT "count_items_stock_count_id_fkey" FOREIGN KEY ("stock_count_id") REFERENCES "public"."stock_counts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_lists"
    ADD CONSTRAINT "product_lists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_lists"
    ADD CONSTRAINT "product_lists_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_product_list_id_fkey" FOREIGN KEY ("product_list_id") REFERENCES "public"."product_lists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_counts"
    ADD CONSTRAINT "stock_counts_product_list_id_fkey" FOREIGN KEY ("product_list_id") REFERENCES "public"."product_lists"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stock_counts"
    ADD CONSTRAINT "stock_counts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stock_counts"
    ADD CONSTRAINT "stock_counts_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_users"
    ADD CONSTRAINT "venue_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_users"
    ADD CONSTRAINT "venue_users_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE "public"."count_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "count_items_delete" ON "public"."count_items" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."stock_counts" "sc"
     JOIN "public"."venue_users" "vu" ON (("vu"."venue_id" = "sc"."venue_id")))
  WHERE (("sc"."id" = "count_items"."stock_count_id") AND ("vu"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "count_items_insert" ON "public"."count_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."stock_counts" "sc"
     JOIN "public"."venue_users" "vu" ON (("vu"."venue_id" = "sc"."venue_id")))
  WHERE (("sc"."id" = "count_items"."stock_count_id") AND ("vu"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "count_items_select" ON "public"."count_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."stock_counts" "sc"
     JOIN "public"."venue_users" "vu" ON (("vu"."venue_id" = "sc"."venue_id")))
  WHERE (("sc"."id" = "count_items"."stock_count_id") AND ("vu"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "count_items_update" ON "public"."count_items" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."stock_counts" "sc"
     JOIN "public"."venue_users" "vu" ON (("vu"."venue_id" = "sc"."venue_id")))
  WHERE (("sc"."id" = "count_items"."stock_count_id") AND ("vu"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."product_lists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_lists_delete" ON "public"."product_lists" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."venue_users"
  WHERE (("venue_users"."venue_id" = "product_lists"."venue_id") AND ("venue_users"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "product_lists_insert" ON "public"."product_lists" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."venue_users"
  WHERE (("venue_users"."venue_id" = "product_lists"."venue_id") AND ("venue_users"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "product_lists_select" ON "public"."product_lists" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."venue_users"
  WHERE (("venue_users"."venue_id" = "product_lists"."venue_id") AND ("venue_users"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "product_lists_update" ON "public"."product_lists" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."venue_users"
  WHERE (("venue_users"."venue_id" = "product_lists"."venue_id") AND ("venue_users"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_delete" ON "public"."products" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."product_lists" "pl"
     JOIN "public"."venue_users" "vu" ON (("vu"."venue_id" = "pl"."venue_id")))
  WHERE (("pl"."id" = "products"."product_list_id") AND ("vu"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "products_insert" ON "public"."products" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."product_lists" "pl"
     JOIN "public"."venue_users" "vu" ON (("vu"."venue_id" = "pl"."venue_id")))
  WHERE (("pl"."id" = "products"."product_list_id") AND ("vu"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "products_select" ON "public"."products" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."product_lists" "pl"
     JOIN "public"."venue_users" "vu" ON (("vu"."venue_id" = "pl"."venue_id")))
  WHERE (("pl"."id" = "products"."product_list_id") AND ("vu"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "products_update" ON "public"."products" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."product_lists" "pl"
     JOIN "public"."venue_users" "vu" ON (("vu"."venue_id" = "pl"."venue_id")))
  WHERE (("pl"."id" = "products"."product_list_id") AND ("vu"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "profiles_update" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."stock_counts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stock_counts_delete" ON "public"."stock_counts" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."venue_users"
  WHERE (("venue_users"."venue_id" = "stock_counts"."venue_id") AND ("venue_users"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "stock_counts_insert" ON "public"."stock_counts" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."venue_users"
  WHERE (("venue_users"."venue_id" = "stock_counts"."venue_id") AND ("venue_users"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "stock_counts_select" ON "public"."stock_counts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."venue_users"
  WHERE (("venue_users"."venue_id" = "stock_counts"."venue_id") AND ("venue_users"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "stock_counts_update" ON "public"."stock_counts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."venue_users"
  WHERE (("venue_users"."venue_id" = "stock_counts"."venue_id") AND ("venue_users"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."venue_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venue_users_select" ON "public"."venue_users" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."venues" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venues_select" ON "public"."venues" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."venue_users"
  WHERE (("venue_users"."venue_id" = "venues"."id") AND ("venue_users"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."count_items";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


















GRANT ALL ON TABLE "public"."count_items" TO "anon";
GRANT ALL ON TABLE "public"."count_items" TO "authenticated";
GRANT ALL ON TABLE "public"."count_items" TO "service_role";



GRANT ALL ON TABLE "public"."product_lists" TO "anon";
GRANT ALL ON TABLE "public"."product_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."product_lists" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."stock_counts" TO "anon";
GRANT ALL ON TABLE "public"."stock_counts" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_counts" TO "service_role";



GRANT ALL ON TABLE "public"."venue_users" TO "anon";
GRANT ALL ON TABLE "public"."venue_users" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_users" TO "service_role";



GRANT ALL ON TABLE "public"."venues" TO "anon";
GRANT ALL ON TABLE "public"."venues" TO "authenticated";
GRANT ALL ON TABLE "public"."venues" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


