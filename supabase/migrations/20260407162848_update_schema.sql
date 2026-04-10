-- ============================================================
-- Step 1: Drop old RLS policies
-- ============================================================

DROP POLICY IF EXISTS "count_items_select" ON public.count_items;
DROP POLICY IF EXISTS "count_items_insert" ON public.count_items;
DROP POLICY IF EXISTS "count_items_update" ON public.count_items;
DROP POLICY IF EXISTS "count_items_delete" ON public.count_items;

DROP POLICY IF EXISTS "product_lists_select" ON public.product_lists;
DROP POLICY IF EXISTS "product_lists_insert" ON public.product_lists;
DROP POLICY IF EXISTS "product_lists_update" ON public.product_lists;
DROP POLICY IF EXISTS "product_lists_delete" ON public.product_lists;

DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;

DROP POLICY IF EXISTS "stock_counts_select" ON public.stock_counts;
DROP POLICY IF EXISTS "stock_counts_insert" ON public.stock_counts;
DROP POLICY IF EXISTS "stock_counts_update" ON public.stock_counts;
DROP POLICY IF EXISTS "stock_counts_delete" ON public.stock_counts;

DROP POLICY IF EXISTS "venue_users_select" ON public.venue_users;
DROP POLICY IF EXISTS "venues_select" ON public.venues;

-- ============================================================
-- Step 2: Drop indexes on columns/tables being removed
-- ============================================================

DROP INDEX IF EXISTS public.product_lists_venue_id_idx;
DROP INDEX IF EXISTS public.products_product_list_id_idx;
DROP INDEX IF EXISTS public.stock_counts_venue_id_idx;
DROP INDEX IF EXISTS public.venue_users_user_id_idx;
DROP INDEX IF EXISTS public.venue_users_venue_id_idx;

-- ============================================================
-- Step 3: Alter products table
-- ============================================================

ALTER TABLE public.products DROP CONSTRAINT products_product_list_id_fkey;
ALTER TABLE public.products DROP COLUMN product_list_id;

ALTER TABLE public.products
    ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX products_user_id_idx ON public.products(user_id);

-- ============================================================
-- Step 4: Alter stock_counts table
-- ============================================================

ALTER TABLE public.stock_counts DROP CONSTRAINT stock_counts_venue_id_fkey;
ALTER TABLE public.stock_counts DROP COLUMN venue_id;

ALTER TABLE public.stock_counts DROP CONSTRAINT stock_counts_product_list_id_fkey;
ALTER TABLE public.stock_counts DROP COLUMN product_list_id;

-- Upgrade user_id: was nullable FK to profiles, now NOT NULL FK to auth.users
ALTER TABLE public.stock_counts DROP CONSTRAINT stock_counts_user_id_fkey;
ALTER TABLE public.stock_counts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.stock_counts
    ADD CONSTRAINT stock_counts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================
-- Step 5: Drop unused tables (dependency order)
-- ============================================================

DROP TABLE public.product_lists;
DROP TABLE public.venue_users;
DROP TABLE public.venues;

-- ============================================================
-- Step 6: New RLS policies (owner-only)
-- ============================================================

-- products
CREATE POLICY "products_select" ON public.products
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

CREATE POLICY "products_insert" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "products_update" ON public.products
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id);

CREATE POLICY "products_delete" ON public.products
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = user_id);

-- stock_counts
CREATE POLICY "stock_counts_select" ON public.stock_counts
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);

CREATE POLICY "stock_counts_insert" ON public.stock_counts
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "stock_counts_update" ON public.stock_counts
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id);

CREATE POLICY "stock_counts_delete" ON public.stock_counts
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = user_id);

-- count_items: accessible when parent stock_count belongs to the user
CREATE POLICY "count_items_select" ON public.count_items
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.stock_counts sc
        WHERE sc.id = count_items.stock_count_id
          AND sc.user_id = (select auth.uid())
    ));

CREATE POLICY "count_items_insert" ON public.count_items
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.stock_counts sc
        WHERE sc.id = count_items.stock_count_id
          AND sc.user_id = (select auth.uid())
    ));

CREATE POLICY "count_items_update" ON public.count_items
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.stock_counts sc
        WHERE sc.id = count_items.stock_count_id
          AND sc.user_id = (select auth.uid())
    ));

CREATE POLICY "count_items_delete" ON public.count_items
    FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.stock_counts sc
        WHERE sc.id = count_items.stock_count_id
          AND sc.user_id = (select auth.uid())
    ));
