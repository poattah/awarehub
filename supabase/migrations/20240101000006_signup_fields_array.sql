-- Move signup_forms.fields to an ordered array of field definitions
-- Existing rows (if any) will be transformed from object to array

ALTER TABLE public.signup_forms
  ALTER COLUMN fields SET DEFAULT '[]'::jsonb;

-- Transform existing object-based fields into an ordered array (email first)
DO $$
DECLARE
  r RECORD;
  obj JSONB;
  arr JSONB;
  obj_key TEXT;
BEGIN
  FOR r IN SELECT id, fields FROM public.signup_forms LOOP
    obj := r.fields;
    IF jsonb_typeof(obj) = 'object' THEN
      arr := '[]'::jsonb;
      -- preserve email first, then others in insertion order
      IF obj ? 'email' THEN
        arr := arr || jsonb_build_object(
          'key','email','label','Email','type','email',
          'enabled',(obj->'email'->>'enabled')::bool,
          'required',(obj->'email'->>'required')::bool
        );
      END IF;
      FOR obj_key IN SELECT * FROM jsonb_object_keys(obj) LOOP
        IF obj_key = 'email' THEN
          CONTINUE;
        END IF;
        arr := arr || jsonb_build_object(
          'key', obj_key,
          'label', initcap(replace(obj_key,'_',' ')),
          'type', CASE obj_key WHEN 'phone' THEN 'tel' WHEN 'date_of_birth' THEN 'date' WHEN 'gender' THEN 'select' ELSE 'text' END,
          'enabled', (obj->obj_key->>'enabled')::bool,
          'required', (obj->obj_key->>'required')::bool,
          'options', obj->obj_key->'enum',
          'fields', obj->obj_key->'fields'
        );
      END LOOP;
      UPDATE public.signup_forms SET fields = arr WHERE id = r.id;
    END IF;
  END LOOP;
END$$;
