from app.database.connection import supabase

r = supabase.table("users").select("user_id,name,email,phone_number,role").execute()
print(f"Users found: {len(r.data or [])}")
for u in (r.data or []):
    print(f"  {u['email']} | {u['phone_number']} | {u['role']}")

if not r.data:
    print("No users returned - RLS is likely blocking the query.")
    print("Make sure SUPABASE_KEY in .env is the service_role key (starts with 'eyJ...')")
