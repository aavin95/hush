import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, email } = req.body;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin operations
  );

  try {
    const { data, error } = await supabase
      .from('users') // Your custom users table
      .upsert({
        id: userId,
        email: email,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) throw error;
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error syncing user:', error);
    return res.status(500).json({ error: 'Error syncing user' });
  }
} 